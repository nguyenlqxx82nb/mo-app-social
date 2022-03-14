//
//  CallManager.m
//  CallKit
//
//  Created by Dobrinka Tabakova on 11/13/16.
//  Copyright © 2016 Dobrinka Tabakova. All rights reserved.
//

#import "CallManager.h"
#import <CallKit/CallKit.h>
#import <CallKit/CXError.h>
#import <Stringee/Stringee.h>
#import "InstanceManager.h"
#import "CallControl.h"
#import "StringeeImplement.h"
#import "CallUtils.h"

@interface CallManager () <CXProviderDelegate>

@property (nonatomic, strong) CXProvider NS_AVAILABLE_IOS(10.0) *provider;
@property (nonatomic, strong) CXCallController NS_AVAILABLE_IOS(10.0) *callController;


@end


@implementation CallManager
static CallManager *sharedInstance;
+ (CallManager*)sharedInstance {
  //static ;
//  static dispatch_once_t onceToken;
//  dispatch_once(&onceToken, ^{
//    sharedInstance = [[CallManager alloc] init];
//    sharedInstance.trackedCalls = [NSMutableDictionary dictionary];
//    if (@available(iOS 10, *)) {
//      [sharedInstance provider];
//    }
//  });
  // NSLog(@"sharedInstance");
  @synchronized(self) {
      if (sharedInstance == nil) {
        sharedInstance = [[self alloc] init];
        sharedInstance.trackedCalls = [NSMutableDictionary dictionary];
        [sharedInstance provider];
//        if (@available(iOS 10, *)) {
//          [sharedInstance provider];
//        }
       //  NSLog(@"sharedInstance init");
      }
  }
  // NSLog(@"sharedInstance return");
  return sharedInstance;
}

- (void)handleIncomingPushEvent:(PKPushPayload *)payload NS_AVAILABLE_IOS(10) {
  NSDictionary* data = payload.dictionaryPayload[@"data"][@"map"][@"data"][@"map"];
  // NSLog(@"handleIncomingPushEvent data %@ =", data);
  
  NSString* callId = data[@"callId"];
  NSString* callStatus = data[@"callStatus"];
  NSString* fromPhone = data[@"from"][@"map"][@"number"];
  //NSString* pushType = data[@"data"][@"map"][@"type"];
  NSString* alias = data[@"from"][@"map"][@"alias"];
  if (!callStatus || ![callStatus isEqualToString:@"started"]) {
    return;
  }
  
  NSLog(@"handleIncomingPushEvent callStatus = %@", callStatus);
  if (self.call != nil) {
    NSLog(@"handleIncomingPushEvent da show");
    return;
  }
  
  // Show 1 cuộc gọi chưa có đủ thông tin hiển thị => Update khi nhận được incoming call
  NSLog(@"handleIncomingPushEvent INCOMING PUSH");
  [[StringeeImplement instance] connectToStringeeServer];
  
  self.call = [[CallKitCall alloc] initWidthParams:true andEnableTimer:true];
  self.call.callId = callId;
  self.call.serial = 0; // serial;
  
  [self trackCall:self.call];
  
  NSString* callerName =[CallUtils formatPhone:[CallUtils formatPhone:alias]];
  NSLog(@"handleIncomingPushEvent show call callerName = %@", callerName);
  [self reportIncomingCall:fromPhone andCallerName:callerName completionHandler:^(BOOL status, NSUUID *uuid) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (status) {
        self.call.uuid = uuid;
        if ([InstanceManager instance].callingViewController) {
          [InstanceManager instance].callingViewController.btnAnswer.hidden = NO;
          [InstanceManager instance].callingViewController.btnReject.hidden = NO;
          [InstanceManager instance].callingViewController.btnHangup.hidden = YES;
        }
        if (self.call.stringeeCall) {
          [self updateCallkitInfoFor:self.call.stringeeCall andUuid:uuid];
        }
      } else {
        self.call = nil;
      }
    });
  }];
}

- (void)handleIncomingCallEvent:(StringeeCall*) stringeeCall NS_AVAILABLE_IOS(10) {
  NSLog(@"handleIncomingCallEvent %ld", (long)stringeeCall.signalingState);
  //Background Thread
  dispatch_async(dispatch_get_main_queue(), ^(void){
    //Run UI Updates
    if (!self.call && ![[InstanceManager instance] callingViewController]) {
      NSLog(@"handleIncomingCallEvent new call");
      [self showCallKitFor:stringeeCall];
      [self showCallingVC:stringeeCall];
      [stringeeCall initAnswerCall];
      return;
    }
    if (self.call) {
      NSLog(@"handleIncomingCallEvent update call");
      self.call.stringeeCall = stringeeCall;
      self.call.callId = stringeeCall.callId;
      self.call.serial = stringeeCall.serial;
      
      // Nếu đã show callkit cho call này rồi => update thông tin
      if (self.call.uuid) {
        [self updateCallkitInfoFor:stringeeCall andUuid:self.call.uuid];
      }
      
      // Neu chua show callingViewController
      if (![[InstanceManager instance] callingViewController]) {
        [self showCallingVC:stringeeCall];
      }
      [stringeeCall initAnswerCall];
    } else {
      [stringeeCall rejectWithCompletionHandler:^(BOOL status, int code, NSString *message) {
        NSLog(@"REJECT INCOMING CALL BECAUSE CALLKIT IS SHOWN");
      }];
    }
    
  });
}

- (void)showCallKitFor:(StringeeCall*) stringeeCall NS_AVAILABLE_IOS(10){
  NSLog(@"INCOMING CALL - SHOW CALLKIT");
  if (!stringeeCall) {
    return;
  }
  self.call = [[CallKitCall alloc] initWidthParams:true andEnableTimer:true];
  self.call.stringeeCall = stringeeCall;
  self.call.callId = stringeeCall.callId;
  self.call.serial = stringeeCall.serial;
  
  //CallKitCall* _call = [self getTrackedCall:self.call.callId andSerial:self.call.serial];
  NSString* callerName = [CallUtils formatPhone:stringeeCall.fromAlias];
  NSString* from = stringeeCall.from;
  NSLog(@"showCallKitFor callId= %@, callerName = %@", self.call.callId, callerName);
  [self reportIncomingCall:from andCallerName:callerName
         completionHandler:^(BOOL status, NSUUID *uuid) {
    NSLog(@"showCallKitFor completion status %@ and uuid %@", status ? @"TRUE" : @"FALSE", [uuid UUIDString]);
    if (status) {
      self.call.uuid = uuid;
    }
    else {
      self.call = nil;
    }
  }];
}

-(void) showCallingVC:(StringeeCall*) stringeeCall {
  NSLog(@"showCallingVC");
  if ([InstanceManager instance].callingViewController) {
    NSLog(@"showCallingVC reject");
    [stringeeCall rejectWithCompletionHandler:^(BOOL status, int code, NSString *message) {
      NSLog(@"showCallingVC rejectWithCompletionHandler ");
    }];
  }
  
  CallingViewController* callingVC = [[CallingViewController alloc] initWithParams:@"CallingViewController"
                                                                        andControl:[[CallControl alloc] init] andCall:stringeeCall ];
  callingVC.modalPresentationStyle = UIModalPresentationFullScreen;
  [self delayCallback:^{
    [[UIApplication sharedApplication].keyWindow.rootViewController presentViewController:callingVC animated:NO completion:nil];
  } forTotalSeconds:0.1];
}

- (void) reportIncomingCall:(NSString*) phone andCallerName: (NSString*) callerName
          completionHandler:(void(^)(BOOL error, NSUUID* uuid))completionHandler NS_AVAILABLE_IOS(10) {
  CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
  callUpdate.hasVideo = false;
  callUpdate.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:phone];
  callUpdate.localizedCallerName = [CallUtils formatPhone:callerName];
  NSUUID* uuid = [NSUUID UUID];
  [self.provider reportNewIncomingCallWithUUID:uuid update:callUpdate completion:^(NSError * _Nullable error) {
    NSLog(@"reportIncomingCall callerName = %@", callerName);
    if (!error) {
      [self configureAudioSession];
      completionHandler(true, uuid);
    } else {
      completionHandler(false, uuid);
    }
  }];
}

- (void) updateCallkitInfoFor: (StringeeCall*) stringeeCall andUuid:(NSUUID*) uuid NS_AVAILABLE_IOS(10) {
  [self reportUpdatedCall:stringeeCall.from andCallerName: stringeeCall.fromAlias andUUID:uuid];
}

- (void)reportUpdatedCall:(NSString* )phone andCallerName:(NSString*) callerName andUUID: (NSUUID*)uuid NS_AVAILABLE_IOS(10) {
  CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
  callUpdate.hasVideo = false;
  callUpdate.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:phone];
  callUpdate.localizedCallerName = callerName;
  [[self provider] reportCallWithUUID:uuid updated:callUpdate];
}

- (void)reportAFakeCall NS_AVAILABLE_IOS(11) {
  NSLog(@"reportAFakeCall");
  CXCallUpdate *update = [[CXCallUpdate alloc] init];
  update.localizedCallerName=@"Expired Call";
  NSUUID* uuid = [NSUUID UUID];
  [self.provider reportNewIncomingCallWithUUID:uuid update:update completion:^(NSError * _Nullable error) {
    if (!error) {
      NSLog(@"reportAFakeCall %@", error.localizedDescription);
    }
    dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void){
      //Background Thread
      dispatch_async(dispatch_get_main_queue(), ^(void){
        //Run UI Updates
        self.provider.configuration.includesCallsInRecents = false;
        CXEndCallAction *endCallAction = [[CXEndCallAction alloc] initWithCallUUID:uuid];
        CXTransaction *transaction = [[CXTransaction alloc] init];
        [transaction addAction:endCallAction];
        [self requestTransaction:transaction];
        NSLog(@"reportAFakeCall endcall uuid %@", uuid);
      });
    });
  }];
}

- (void)reportIncomingCallForUUID:(NSUUID*)uuid phoneNumber:(NSString*)phoneNumber completionHandler:(void(^)(NSError *error))completionHandler NS_AVAILABLE_IOS(10.0) {
  NSLog(@"reportIncomingCallForUUID %@", phoneNumber);
  CXCallUpdate *update = [[CXCallUpdate alloc] init];
  update.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:phoneNumber];
  __weak CallManager *weakSelf = self;
  [self.provider reportNewIncomingCallWithUUID:uuid update:update completion:^(NSError * _Nullable error) {
    if (!error) {
      weakSelf.currentCall = uuid;
      [self configureAudioSession];
    }
    completionHandler(error);
  }];
}

- (void)makeCall:(NSString*)phoneNumber calleeName: (NSString*) calleeName stringeCall: (StringeeCall*)stringeCall {
  NSLog(@"makeCall phoneNumber=%@ calleeName = %@", phoneNumber, calleeName);
  if (self.call) {
    return;
  }
  CXHandle *handle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:phoneNumber];
  self.call = [[CallKitCall alloc] initWidthParams:false andEnableTimer:false];
  self.call.stringeeCall = stringeCall;
  self.call.callId = stringeCall.callId;
  self.call.serial = stringeCall.serial;
  self.call.uuid = [NSUUID UUID];
  
  CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:self.self.call.uuid handle:handle];
  startCallAction.video = NO;
  startCallAction.contactIdentifier = [CallUtils formatPhone:calleeName];
  
  CXTransaction *transaction = [[CXTransaction alloc] init];
  [transaction addAction:startCallAction];
  [self requestTransaction:transaction];
  
  [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeDidMakeCall" object:self userInfo:@{@"callId": stringeCall.callId, @"toPhone": phoneNumber}];
}
                 
 - (void)answerCall {
   if (@available(iOS 10, *)) {
     if (self.call && self.call.uuid) {
       CXAnswerCallAction *answerCallAction = [[CXAnswerCallAction alloc] initWithCallUUID:self.call.uuid];
       CXTransaction *transaction = [[CXTransaction alloc] init];
       [transaction addAction:answerCallAction];
       [self requestTransaction:transaction];
     }
   }
 }

- (void)endCall {
  if (@available(iOS 10, *)) {
    if (self.call && self.call.uuid) {
      CXEndCallAction *endCallAction = [[CXEndCallAction alloc] initWithCallUUID:self.call.uuid];
      CXTransaction *transaction = [[CXTransaction alloc] init];
      [transaction addAction:endCallAction];
      [self requestTransaction:transaction];
    }
  }
}

- (void)holdCall:(BOOL)hold {
  if (@available(iOS 10, *)) {
    if (self.call && self.call.uuid) {
      CXSetHeldCallAction *holdCallAction = [[CXSetHeldCallAction alloc] initWithCallUUID:self.call.uuid onHold:hold];
      CXTransaction *transaction = [[CXTransaction alloc] init];
      [transaction addAction:holdCallAction];
      [self requestTransaction:transaction];
    }
  }
}

- (void)requestTransaction:(CXTransaction*)transaction NS_AVAILABLE_IOS(10.0) {
  if (@available(iOS 10, *)) {
    [self.callController requestTransaction:transaction completion:^(NSError * _Nullable error) {
    }];
  }
}

#pragma mark - Call Action
- (void) answerCallWithCondition: (BOOL) shouldChangeUI {
  if (!self.call) {
    return ;
  }
//  NSLog(@"answerCallWithCondition shouldChangeUI= %@ isIncoming= %@ answered = %@ audioIsActived = %@", shouldChangeUI ? @"yes" : @"no"
//        , self.call.isIncoming ? @"yes" : @"no", self.call.answered ? @"yes" : @"no", self.call.audioIsActived ? @"yes" : @"no");
  if (self.call.isIncoming && self.call.answered && self.call.stringeeCall
      && (self.call.audioIsActived || self.call.answerAction != nil)) {
    [self anwser: shouldChangeUI];
  }
}



- (void) anwser: (BOOL) shouldChangeUI {
  NSLog(@"answer %@", shouldChangeUI ? @"yes" : @"no");
  if ([InstanceManager instance].callingViewController && shouldChangeUI) {
    [InstanceManager instance].callingViewController.callControl.signalingState = SignalingStateAnswered;
    [[InstanceManager instance].callingViewController updateScreen];
  }
  
  if (self.call.answerAction) {
    NSLog(@"answer answerAction");
    [self.call.answerAction fulfill];
    self.call.answerAction = nil;
    return;
  }
  
  NSLog(@"stringeeCall answer ");
  [self.call.stringeeCall answerCallWithCompletionHandler:^(BOOL status, int code, NSString *message) {
    NSLog(@"====== ANWSER status = %@ to = %@ to alias = %@", status? @"YES" : @"NO", self.call.stringeeCall.to, self.call.stringeeCall.toAlias);
    CallingViewController* callingVC = [InstanceManager instance].callingViewController;
    if (!status && callingVC) {
      [callingVC endCallAndDismissWithTitle:@"Kết thúc"];
      return;
    }
    if (!status) {
      [self endCall];
    }
    if (status && callingVC) {
      [callingVC updateAnswerState];
    }
  }];
}

- (void) reject: (StringeeCall*) stringeeCall {
  NSLog(@"reject");
  if (!self.call) {
    return;
  }
  [self.call clean];
  self.call.rejected = true;
  [self endCall];
  
  StringeeCall* callNeedToReject = stringeeCall ? stringeeCall : self.call.stringeeCall;
  if (!callNeedToReject) {
    return;
  }
  [callNeedToReject rejectWithCompletionHandler:^(BOOL status, int code, NSString *message) {
    NSLog(@"====== REJECT status = %@", status? @"YES" : @"NO");
    if ([InstanceManager instance].callingViewController) {
      [[InstanceManager instance].callingViewController endCallAndDismissWithTitle:@"Kết thúc"];
      return;
    }
  }];
}

- (void) hangup: (StringeeCall*) stringeeCall {
  NSLog(@"hangup");
  if (!self.call) {
    return;
  }
  [self.call clean];
  self.call.rejected = true;
  [self endCall];
  
  StringeeCall* callNeedToHangup = stringeeCall ? stringeeCall : self.call.stringeeCall;
  if (!callNeedToHangup) {
    return;
  }
  [callNeedToHangup hangupWithCompletionHandler:^(BOOL status, int code, NSString *message) {
    NSLog(@"====== HANGUP status = %@", status? @"YES" : @"NO");
    // end call
    if ([InstanceManager instance].callingViewController) {
      [[InstanceManager instance].callingViewController endCallAndDismissWithTitle:@"Kết thúc"];
      return;
    }
  }];
}

- (void) mute: (void(^)(BOOL status))completionHandler {
  CallingViewController* callingVC = [InstanceManager instance].callingViewController;
  if (!callingVC || !self.call.stringeeCall) {
    completionHandler(false);
  }
  
  [self.call.stringeeCall mute:!callingVC.callControl.isMute];
  callingVC.callControl.isMute = !callingVC.callControl.isMute;
}

- (void)sendDTMF:(CallDTMF) key {
  // NSLog(@"Call sendDTMF %ld", key);
  if (!self.call || !self.call.stringeeCall) {
    return;
  }
  [self.call.stringeeCall sendDTMF:key completionHandler:^(BOOL status, int code, NSString *message) {
    NSLog(@"Call sendDTMF response %@", message);
  }];
}

- (void)callToPhone:(NSString*)fromPhone andToPhone:(NSString*)toPhone {
  NSLog(@"RNCallCenter fromPhone = %@ toPhone= %@", fromPhone, toPhone);
  if ([StringeeImplement instance].stringeeClient.hasConnected) {
    CallControl* callControl = [[CallControl alloc] init];
    callControl.from = fromPhone;
    callControl.to = toPhone;
    CallingViewController* callingVC = [[CallingViewController alloc] initWithParams:@"CallingViewController" andControl:callControl andCall:nil ];
    callingVC.modalPresentationStyle = UIModalPresentationFullScreen;
    [CallUtils delayCallback:^{
      [[UIApplication sharedApplication].keyWindow.rootViewController presentViewController:callingVC animated:NO completion:nil];
    } forTotalSeconds:0.1];
  }
}

#pragma mark - Getters

- (CXProvider*)provider {
  if (!_provider) {
    CXProviderConfiguration *configuration = [[CXProviderConfiguration alloc] initWithLocalizedName:@"Mobio"];
    configuration.supportsVideo = NO;
    configuration.maximumCallsPerCallGroup = 1;
    configuration.supportedHandleTypes = [NSSet setWithObject:@(CXHandleTypeGeneric)];
    _provider = [[CXProvider alloc] initWithConfiguration:configuration];
    [_provider setDelegate:self queue:nil];
  }
  return _provider;
}

- (CXCallController*)callController NS_AVAILABLE_IOS(10.0) {
  if (!_callController) {
    _callController = [[CXCallController alloc] init];
  }
  return _callController;
}

#pragma mark - CXProviderDelegate

- (void)providerDidReset:(CXProvider *)provider NS_AVAILABLE_IOS(10.0) {
  NSLog(@"providerDidReset");
}

/// Called when the provider has been fully created and is ready to send actions and receive updates
- (void)providerDidBegin:(CXProvider *)provider NS_AVAILABLE_IOS(10.0) {
  NSLog(@"providerDidBegin");
}

// If provider:executeTransaction:error: returned NO, each perform*CallAction method is called sequentially for each action in the transaction
- (void)provider:(CXProvider *)provider performStartCallAction:(CXStartCallAction *)action NS_AVAILABLE_IOS(10.0) {
  NSLog(@"performStartCallAction");
  
  //todo: configure audio session
  [self configureAudioSession];
  
  //todo: start network call
  [self.provider reportOutgoingCallWithUUID:action.callUUID startedConnectingAtDate:nil];
  [self.provider reportOutgoingCallWithUUID:action.callUUID connectedAtDate:nil];
  
  [action fulfill];
}

- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action NS_AVAILABLE_IOS(10.0) {
  NSLog(@"performAnswerCallAction");
  if (!self.call) {
    return;
  }
  NSLog(@"performAnswerCallAction 2");
  self.call.answered = true;
  self.call.answerAction = action;
  [self.call clean];
  [self answerCallWithCondition: true];
}

- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action NS_AVAILABLE_IOS(10.0) {
  NSLog(@"performEndCallAction uuid = %@", [action.callUUID UUIDString]);
  if (!self.call) {
    [action fulfill];
    return;
  }
  if (self.call.stringeeCall) {
    StringeeCall* stringeeCall = self.call.stringeeCall;
    if (stringeeCall.signalingState != SignalingStateBusy && stringeeCall.signalingState != SignalingStateEnded) {
      if (self.call.isIncoming && !self.call.answered) {
        [self reject:stringeeCall];
      } else {
        [self hangup:stringeeCall];
      }
    }
  }
  [self.call clean];
  self.call = nil;
  [action fulfill];
}

- (void)provider:(CXProvider *)provider performSetHeldCallAction:(CXSetHeldCallAction *)action NS_AVAILABLE_IOS(10.0) {
  NSLog(@"performSetHeldCallAction");
  //    if (action.isOnHold) {
  //        //todo: stop audio
  //    } else {
  //        //todo: start audio
  //    }
  //    if (self.delegate && [self.delegate respondsToSelector:@selector(callDidHold:)]) {
  //        [self.delegate callDidHold:action.isOnHold];
  //    }
  [action fulfill];
}

- (void)provider:(CXProvider *)provider performSetMutedCallAction:(CXSetMutedCallAction *)action NS_AVAILABLE_IOS(10.0) {
}

- (void)provider:(CXProvider *)provider performSetGroupCallAction:(CXSetGroupCallAction *)action NS_AVAILABLE_IOS(10.0) {
}

- (void)provider:(CXProvider *)provider performPlayDTMFCallAction:(CXPlayDTMFCallAction *)action NS_AVAILABLE_IOS(10.0) {
}

/// Called when an action was not performed in time and has been inherently failed. Depending on the action, this timeout may also force the call to end. An action that has already timed out should not be fulfilled or failed by the provider delegate
- (void)provider:(CXProvider *)provider timedOutPerformingAction:(CXAction *)action NS_AVAILABLE_IOS(10.0) {
  // React to the action timeout if necessary, such as showing an error UI.
}

/// Called when the provider's audio session activation state changes.
- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession NS_AVAILABLE_IOS(10.0) {
  NSLog(@"didActivateAudioSession");
  if (!self.call) {
    return;
  }
  self.call.audioIsActived = true;
  [self answerCallWithCondition:true];
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession NS_AVAILABLE_IOS(10.0) {
  NSLog(@"didDeactivateAudioSession");
  if (!self.call) {
    return;
  }
  self.call.audioIsActived = false;
}

// MARK: - other methods

- (void)configureAudioSession {
  
  NSError *err;
  AVAudioSession *audioSession = [AVAudioSession sharedInstance];
  
  [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:&err];
  
  if (err) {
    NSLog(@"Category Error %ld, %@",(long)err.code, err.localizedDescription);
  }
  
  [audioSession setMode:AVAudioSessionModeVoiceChat error:&err];
  if (err) {
    NSLog(@"Mode Error %ld, %@",(long)err.code, err.localizedDescription);
  }
  
  double sampleRate = 44100.0;
  [audioSession setPreferredSampleRate:sampleRate error:&err];
  if (err) {
    NSLog(@"Sample Rate Error %ld, %@",(long)err.code, err.localizedDescription);
  }
  
  NSTimeInterval bufferDuration = .005;
  [audioSession setPreferredIOBufferDuration:bufferDuration error:&err];
  if (err) {
    NSLog(@"IO Buffer Duration Error %ld, %@",(long)err.code, err.localizedDescription);
  }
}

- (void)delayCallback:(void(^)(void))callback forTotalSeconds:(double)delayInSeconds {
  dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
  dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    if(callback){
      callback();
    }
  });
}

- (void)trackCall:(CallKitCall*) callNeedToTrack {
  NSString* key = [NSString stringWithFormat:@"%@-%i",callNeedToTrack.callId, callNeedToTrack.serial];
  NSLog(@"===== KEY TO SAVE CALL <> %@", key);
  self.trackedCalls[key] = callNeedToTrack;
}

- (CallKitCall*) getTrackedCall: (NSString*) callId andSerial: (int) serial {
  NSString* key = [NSString stringWithFormat:@"%@-%i", callId, serial];
  NSLog(@"===== KEY TO GET CALL <> %@", key);
  return self.trackedCalls[key];
}

- (void) clean {
  self.call = nil;
}

@end


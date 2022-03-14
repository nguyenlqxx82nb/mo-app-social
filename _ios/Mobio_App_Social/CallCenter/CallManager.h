//
//  CallManager.h
//  CallKit
//
//  Created by Dobrinka Tabakova on 11/13/16.
//  Copyright © 2016 Dobrinka Tabakova. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <PushKit/PushKit.h>
#import <Stringee/Stringee.h>
#import "CallKitCall.h"

@protocol CallManagerDelegate <NSObject>

- (void)callDidAnswer;
- (void)callDidEnd;
- (void)callDidHold:(BOOL)isOnHold;
- (void)callDidFail:(NSError *)error;
- (void)callDidActiveAudioSession;
- (void)callDidDeactiveAudioSession;

@end

@interface CallManager : NSObject

+ (CallManager*)sharedInstance;

- (void)reportIncomingCallForUUID:(NSUUID*)uuid phoneNumber:(NSString*)phoneNumber completionHandler:(void(^)(NSError *error))completionHandler;
// - (void)startCall:(NSString*)phoneNumber calleeName: (NSString*) calleeName stringeCall: (StringeeCall*)stringeCall;
- (void)makeCall:(NSString*)phoneNumber calleeName: (NSString*) calleeName stringeCall: (StringeeCall*)stringeCall;
- (void)endCall;
- (void)holdCall:(BOOL)hold;
- (void)handleIncomingPushEvent:(PKPushPayload *)payload;
- (void)reportAFakeCall;
- (void)handleIncomingCallEvent:(StringeeCall*) stringeeCall;
- (void)callToPhone:(NSString*)fromPhone andToPhone:(NSString*)toPhone;

- (void) anwser:(BOOL) shouldChangeUI;
- (void) reject: (StringeeCall*) stringeeCall;
- (void) hangup: (StringeeCall*) stringeeCall;
- (void) mute: (void(^)(BOOL status))completionHandler;
- (void) clean;
- (void) answerCall;
- (void) sendDTMF:(CallDTMF) key;
- (void)showCallKitFor:(StringeeCall*) stringeeCall NS_AVAILABLE_IOS(10);

@property (nonatomic, weak) id<CallManagerDelegate> delegate;
@property (nonatomic, strong) NSUUID *currentCall;
@property (nonatomic, strong) CallKitCall* call;
@property (nonatomic, strong) NSMutableDictionary<NSString *, CallKitCall*> *trackedCalls;


@end

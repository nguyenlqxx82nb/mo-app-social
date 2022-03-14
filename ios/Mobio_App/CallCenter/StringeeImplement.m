//
//  StringeeImplement.m
//  SampleVoiceCall
//
//  Created by NguyenLQ on 10/02/21.
//  Copyright © 2021 NGUYEN LE. All rights reserved.
//

#import "StringeeImplement.h"
#import "CallManager.h"
#import "InstanceManager.h"
#import "CallingViewController.h"
#import "StringeeImplement.h"
#import "CallUtils.h"

@implementation StringeeImplement {
  StringeeCall * seCall;
  BOOL hasAnswered;
  BOOL hasConnected;
  BOOL audioIsActived;
  
  NSTimer *ringingTimer;
  
  UIBackgroundTaskIdentifier backgroundTaskIdentifier;
}

static StringeeImplement *sharedMyManager = nil;

+ (StringeeImplement *)instance {
  @synchronized(self) {
    if (sharedMyManager == nil) {
      sharedMyManager = [[self alloc] init];
    }
  }
  return sharedMyManager;
}

- (id)init {
  self = [super init];
  if (self) {
    // Khởi tạo StringeeClient
    self.stringeeClient = [[StringeeClient alloc] initWithConnectionDelegate:self];
    self.stringeeClient.incomingCallDelegate = self;
  }
  return self;
}

// Kết nối tới stringee server
-(BOOL) connectToStringeeServer {
  if (self.stringeeClient.hasConnected) {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeDidConnected" object:nil];
    return true;
  }
  // [self fetchAccessToken];
  NSString* accessToken = [CallUtils getAccessToken];
  NSLog(@"connectToStringeeServer %@", accessToken);
  if (!accessToken) {
    return false;
  }
  [self.stringeeClient connectWithAccessToken:accessToken];
  return true;
}

// MARK:- Stringee Connection Delegate

// Lấy access token mới và kết nối lại đến server khi mà token cũ không có hiệu lực
- (void)requestAccessToken:(StringeeClient *)StringeeClient {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* accessToken = [prefs valueForKey:@"ACCESS_TOKEN"];
  if (!accessToken) {
    return;
  }
  NSLog(@"requestAccessToken %@", accessToken);
  [self.stringeeClient connectWithAccessToken:accessToken];
}

- (void)didConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting {
  NSLog(@"didConnect");
  [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeDidConnected" object:nil];
  dispatch_async(dispatch_get_main_queue(), ^{
    NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
    BOOL hasRegisteredToReceivePush = [prefs boolForKey:@"hasRegisteredToReceivePush"];
    NSData* deviceToken = [InstanceManager instance].deviceToken;
    NSLog(@"Register device token hasRegisteredToReceivePush = %@, deviceToken=%@", hasRegisteredToReceivePush ? @"YES" : @"NO", deviceToken);
    // Nếu chưa đăng ký nhận push thì đăng ký hoặc khi logout sau đó conect với tài khoản khác thì cũng cần đăng ký
    if (!hasRegisteredToReceivePush && deviceToken) {
      [self registerDeviceToken:deviceToken];
    }
  });
}

- (void) registerDeviceToken:(NSData*) token {
  NSString* deviceToken = [CallUtils convertDataToHexStr:token];
  NSLog(@"registerDeviceToken token=%@--", deviceToken);
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  [self.stringeeClient registerPushForDeviceToken:deviceToken isProduction:YES isVoip:YES
    completionHandler:^(BOOL status, int code, NSString *message) {
    NSLog(@"%@", message);
    if (status) {
      [prefs setValue:deviceToken forKey:@"DEVICE_TOKEN"];
      [prefs setBool:true forKey:@"hasRegisteredToReceivePush"];
    }
  }];
}

- (void)didDisConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting {
  NSLog(@"didDisConnect");
  [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeDisConnected" object:nil];
  dispatch_async(dispatch_get_main_queue(), ^{
    // [InstanceManager instance].homeViewController.btCall.enabled = NO;
  });
}

- (void)didFailWithError:(StringeeClient *)stringeeClient code:(int)code message:(NSString *)message {
  NSLog(@"didFailWithError - %@", message);
}

- (void)incomingCallWithStringeeClient:(StringeeClient *)stringeeClient stringeeCall:(StringeeCall *)stringeeCall {
  NSLog(@"incomingCallWithStringeeClient - FROM %@, callId %@ ", stringeeCall.from, stringeeCall.callId);
  [[CallManager sharedInstance] handleIncomingCallEvent:stringeeCall];
}

//- (void)setStringeeCallDelegate:(StringeeCall*) stringeeCall {
//  stringeeCall.delegate = self;
//}

// MARK: - Private Method

- (void)delayCallback:(void(^)(void))callback forTotalSeconds:(double)delayInSeconds {
  dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
  dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    if(callback){
      callback();
    }
  });
}

- (void)beginBackgroundTask {
  backgroundTaskIdentifier = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
    [self endBackgroundTask];
  }];
}

- (void)endBackgroundTask {
  [[UIApplication sharedApplication] endBackgroundTask:backgroundTaskIdentifier];
  backgroundTaskIdentifier = UIBackgroundTaskInvalid;
}

- (void)callDidDeactiveAudioSession {
  NSLog(@"callDidDeactiveAudioSession");
  audioIsActived = NO;
}
@end

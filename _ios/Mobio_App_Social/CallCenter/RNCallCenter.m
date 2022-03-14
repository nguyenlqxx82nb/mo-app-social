//
//  RNCallCenter.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/6/21.
//

#import <Foundation/Foundation.h>
#import "RNCallCenter.h"
#import <React/RCTBridge.h>
#import "StringeeImplement.h"
#import "InstanceManager.h"
#import "CallUtils.h"

//static bool waiting = true;
//static bool addedJsLoadErrorObserver = false;
//static UIView* loadingView = nil;

@implementation RNCallCenter

- (instancetype)init {
  self = [super init];
  if ( self ) {
    NSLog(@"init callcenter");
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    NSNotificationCenter * notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self selector:@selector(stringeeDidConnectedHandler:) name:@"stringeeDidConnected" object:nil];
    [notificationCenter addObserver:self selector:@selector(stringeeDisConnectedHandler:) name:@"stringeeDisConnected" object:nil];
    [notificationCenter addObserver:self selector:@selector(stringeeDidMakeCallHandler:) name:@"stringeeDidMakeCall" object:nil];
    [notificationCenter addObserver:self selector:@selector(stringeeEndCallHandler:) name:@"stringeeEndCall" object:nil];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onStringeeDidConnected",@"onStringeeDisConnected",@"onStringeeDidMakeCall",@"onStringeeEndCall"];
}

- (void) stringeeDidConnectedHandler: (NSNotification *)notif {
  NSLog(@"NOTIFICATION EVENT stringeeDidConnectedHandler");
  [self sendEventWithName:@"onStringeeDidConnected" body:@{@"userId": @"userId"}];
}

- (void) stringeeDisConnectedHandler: (NSNotification *)notif {
  NSLog(@"NOTIFICATION EVENT stringeeDisConnectedHandler");
  [self sendEventWithName:@"onStringeeDisConnected" body:nil];
}

- (void) stringeeDidMakeCallHandler: (NSNotification *)notif {
  NSDictionary *dict = notif.userInfo;
  NSString* toPhone = dict[@"toPhone"];
  NSString* callId = dict[@"callId"];
  NSLog(@"NOTIFICATION EVENT stringeeDidMakeCallHandler toPhone = %@ callId = %@", toPhone, callId);
  [self sendEventWithName:@"onStringeeDidMakeCall" body:@{@"callId": callId, @"toPhone": toPhone, @"openProfile": @""}];
}

- (void) stringeeEndCallHandler: (NSNotification *)notif {
  NSDictionary *dict = notif.userInfo;
  NSString* time = dict[@"time"];
  NSString* callId = dict[@"callId"];
  NSLog(@"NOTIFICATION EVENT stringeeEndCallHandler time = %@ callId = %@", time, callId);
  [self sendEventWithName:@"onStringeeEndCall" body:@{@"callId": callId, @"time": time}];
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) initAndConnectStringee {
  [[StringeeImplement instance] connectToStringeeServer];
}

- (dispatch_queue_t)methodQueue{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(MoCallCenter)

RCT_EXPORT_METHOD(initAndConnect:(NSString*)token) {
  NSLog(@"RNCallCenter initAndConnect token= %@", token);
  [[StringeeImplement instance] connectToStringeeServer];
}

RCT_EXPORT_METHOD(clear) {
  NSUserDefaults * userDefaults = [NSUserDefaults standardUserDefaults];
  StringeeClient* client = [StringeeImplement instance].stringeeClient;
  if (client) {
    NSString* device_token = [userDefaults valueForKey:@"DEVICE_TOKEN"];
    NSLog(@"unregisterPushForDeviceToken = %@", device_token);
    if (device_token) {
      [client unregisterPushForDeviceToken:device_token completionHandler:^(BOOL status, int code, NSString *message) {
        NSLog(@"unregisterPushForDeviceToken = %@",message);
        [client disconnect];
      }];
    } else {
      [client disconnect];
    }
  }
  NSDictionary * dict = [userDefaults dictionaryRepresentation];
  for (id key in dict) {
      [userDefaults removeObjectForKey:key];
  }
  [userDefaults synchronize];
  // [InstanceManager instance].deviceToken = nil;
  NSLog(@"RNCallCenter clear");
}

RCT_EXPORT_METHOD(makeCall:(NSString*)fromPhone andToPhone:(NSString*)toPhone) {
  [[CallManager sharedInstance] callToPhone:fromPhone andToPhone:toPhone];
}

RCT_EXPORT_METHOD(setValue:(NSString*)key andValue:(NSString*)value ) {
  NSLog(@"RNCallCenter setValue key= %@ value=%@ ", key, value);
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  [prefs setValue:value forKey:key];
}

RCT_EXPORT_METHOD(remove:(NSString*)key) {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  [prefs removeObjectForKey:key];
  NSLog(@"RNCallCenter remove key= %@ ", key);
}

RCT_EXPORT_METHOD(updateCurrModule:(NSString*)currModule) {
  NSLog(@"RNCallCenter updateCurrModule currModule = %@", currModule);
}

@end


//
//  RNPushNotification.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 3/16/21.
//

#import "RNPushNotification.h"
#import <Foundation/Foundation.h>
#import "RNCallCenter.h"
#import <React/RCTBridge.h>

static NSString* _deviceToken;
static NSMutableDictionary* messageSocialData;
static NSString *const notificationSocialEvent = @"notificationSocialEvent";

@implementation RNPushNotification

RCT_EXPORT_MODULE(PushNotification);

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:notificationSocialEvent
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


- (NSArray<NSString *> *)supportedEvents {
    return @[notificationSocialEvent];
}

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = deviceToken.bytes;
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  
  _deviceToken = [hexString copy];
  // NSLog(@"didRegisterForRemoteNotificationsWithDeviceToken deviceToken = %@", _deviceToken);
}

+ (void) requestPermissions:(NSDictionary *)permissions {
  UNAuthorizationOptions types = UNAuthorizationOptionNone;
  types = UNAuthorizationOptionAlert | UNAuthorizationOptionBadge | UNAuthorizationOptionSound;
  
  [UNUserNotificationCenter.currentNotificationCenter
    requestAuthorizationWithOptions:types
    completionHandler:^(BOOL granted, NSError *_Nullable error) {

    if (error != NULL) {
      // reject(@"-1", @"Error - Push authorization request failed.", error);
    } else {
      dispatch_async(dispatch_get_main_queue(), ^(void){
        [RCTSharedApplication() registerForRemoteNotifications];
      });
      [UNUserNotificationCenter.currentNotificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
        //resolve(RCTPromiseResolveValueForUNNotificationSettings(settings));
      }];
    }
  }];
}

+ (void) didReceiveNotificationResponse: (UNNotificationResponse *) response {
  NSUserDefaults* userDefaults = [NSUserDefaults standardUserDefaults];
  NSString* auth_token = [userDefaults valueForKey:@"AUTH_TOKEN"];
  // NSLog(@"didReceiveNotificationResponse auth_token = %@",auth_token);
  if (auth_token == nil) {
    return;
  }
  
  UNNotification* notification = response.notification;
  UNNotificationContent *content = notification.request.content;
  NSMutableDictionary *userInfo = [content.userInfo mutableCopy];
  NSMutableDictionary *data = userInfo[@"data"][@"data"];
  // NSLog(@"didReceiveNotificationResponse data = %@", data);
  if (data == nil) {
    return;
  }
  
  if (data[@"socket_type"] != nil) {
    UIApplicationState state = [[UIApplication sharedApplication] applicationState];
    if (state != UIApplicationStateBackground) {
      [[NSNotificationCenter defaultCenter] postNotificationName:notificationSocialEvent
                                                          object:self
                                                         userInfo:data];
    } else {
      messageSocialData = data;
    }
  }
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"notificationSocialEvent" body:@{@"data": notification.userInfo}];
}

RCT_EXPORT_METHOD(getRegistrationToken: (RCTResponseSenderBlock) callback) {
  NSLog(@"getRegistrationToken token = %@", _deviceToken);
  NSString* deviceToken = _deviceToken == nil ? @"" : _deviceToken;
  callback(@[deviceToken ]);
}

RCT_EXPORT_METHOD(scheduleExpiredNotification: (double) expiredTimeLeft) {
  NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
  numberFormatter.numberStyle = NSNumberFormatterDecimalStyle;
  double timeLeft = 7*24*60*60 - expiredTimeLeft*60*60;
  NSLog(@"scheduleExpiredNotification timeLeft=%@", [NSNumber numberWithDouble:timeLeft].stringValue);
  UNMutableNotificationContent *objNotificationContent = [[UNMutableNotificationContent alloc] init];
  NSString* body = @"";
  body = [body stringByAppendingFormat:@"Thời gian đăng nhập sẽ hết sau %@ giờ", [NSNumber numberWithDouble:expiredTimeLeft].stringValue];
  objNotificationContent.title = [NSString localizedUserNotificationStringForKey:@"Thời gian đăng nhập sắp hết hạn" arguments:nil];
  objNotificationContent.body = body;
  objNotificationContent.sound = [UNNotificationSound defaultSound];

  // Deliver the notification in five seconds.
  UNTimeIntervalNotificationTrigger *trigger =  [UNTimeIntervalNotificationTrigger                                        triggerWithTimeInterval:timeLeft repeats:NO];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:@"expiredNotification" content:objNotificationContent trigger:trigger];
  // 3. schedule localNotification
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

  [center addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
      if (!error) {
          NSLog(@"Local Notification succeeded");
      } else {
          NSLog(@"Local Notification failed");
      }
  }];
}

RCT_EXPORT_METHOD(clear) {
  NSLog(@"RNPushNotification Clear");
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeAllDeliveredNotifications];
  [center removeAllPendingNotificationRequests];
  
  NSUserDefaults * userDefaults = [NSUserDefaults standardUserDefaults];
  [userDefaults removeObjectForKey:@"AUTH_TOKEN"];
  [userDefaults synchronize];
}

RCT_EXPORT_METHOD(removeSocialMessageData) {
  NSLog(@"removeSocialMessageData");
  messageSocialData = nil;
}

RCT_EXPORT_METHOD(getSocialMessageData: (RCTResponseSenderBlock) callback) {
  NSLog(@"getSocialMessageData data = %@", messageSocialData);
  callback(@[messageSocialData != nil ? messageSocialData : @""]);
}

RCT_EXPORT_METHOD(getDeviceId: (RCTResponseSenderBlock) callback) {
  NSString *uniqueIdentifier = [[[UIDevice currentDevice] identifierForVendor] UUIDString];
  NSLog(@"RNPushNotification getDeviceId= %@", uniqueIdentifier);
  callback(@[uniqueIdentifier]);
}

RCT_EXPORT_METHOD(setValue:(NSString*)key andValue:(NSString*)value ) {
  NSLog(@"RNPush setValue key= %@ value=%@ ", key, value);
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  [prefs setValue:value forKey:key];
}

RCT_EXPORT_METHOD(remove:(NSString*)key) {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  [prefs removeObjectForKey:key];
  NSLog(@"RNPush remove key= %@ ", key);
}

@end

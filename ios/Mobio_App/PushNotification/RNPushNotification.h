//
//  RNPushNotification.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 3/16/21.
//

#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>
#import <React/RCTEventEmitter.h>
#import <UserNotifications/UserNotifications.h>

@interface RNPushNotification : RCTEventEmitter <RCTBridgeModule>
 
- (void) getRegistrationToken: (NSString*) token;
+ (void) requestPermissions:(NSDictionary *)permissions;
+ (void) didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
+ (void) didReceiveNotificationResponse: (UNNotificationResponse *) response;
@end

#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <PushKit/PushKit.h>
#import <UserNotifications/UNUserNotificationCenter.h>
#import <UserNotifications/UserNotifications.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, PKPushRegistryDelegate, UNUserNotificationCenterDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

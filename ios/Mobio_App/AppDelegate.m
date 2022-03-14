#import "AppDelegate.h"
#import "RNCallCenter.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNSplashScreen.h"
#import "StringeeImplement.h"
#import <Stringee/Stringee.h>
#import "InstanceManager.h"
#import <UserNotifications/UserNotifications.h>
#import "RNPushNotification.h"
#import <AudioToolbox/AudioServices.h>
    
#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate 

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif
  // Local push
  if ([UIApplication instancesRespondToSelector:@selector(registerUserNotificationSettings:)]) {
      [application registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound categories:nil]];
  }
  
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"Mobio_App"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [self voipRegistration];
  [RNPushNotification requestPermissions:nil];
  UIApplicationState state = [[UIApplication sharedApplication] applicationState];
  if (state == UIApplicationStateBackground) {
    NSLog(@"UIApplicationStateBackground");
  } else {
    NSLog(@"UIApplicationStateForeground");
    [RNSplashScreen show];
    RCTSharedApplication().applicationIconBadgeNumber = -1;
  }
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)applicationWillResignActive:(UIApplication *)application {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    // [[UIApplication sharedApplication] cancelAllLocalNotifications];
    // [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
}

- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

- (void) voipRegistration {
    dispatch_queue_t mainQueue = dispatch_get_main_queue();
    // Create a push registry object
    PKPushRegistry * voipRegistry = [[PKPushRegistry alloc] initWithQueue: mainQueue];
    // Set the registry's delegate to self
    voipRegistry.delegate = self;
    // Set the push type to VoIP
    voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
  
  NSLog(@"voipRegistration");
}

- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials: (PKPushCredentials *)credentials forType:(NSString *)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  NSData* token = credentials.token;
  StringeeClient* client = [StringeeImplement instance].stringeeClient;
  NSLog(@"**************** Token - Voip push: %@", token);
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  BOOL hasRegisteredToReceivePush = [prefs boolForKey:@"hasRegisteredToReceivePush"];
  [InstanceManager instance].deviceToken = token;
  if (!hasRegisteredToReceivePush && client.hasConnected) {
    // Chú ý: trước khi up lên store thì phải chuyển isProduction = YES
    [[StringeeImplement instance] registerDeviceToken:token];
  }
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(NSString *)type {
  // NSLog(@"didReceiveIncomingPushWithPayload %@", payload.dictionaryPayload);
  [[CallManager sharedInstance] handleIncomingPushEvent:payload];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
    NSLog(@"didReceiveLocalNotification");
}

// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RNPushNotification didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
  fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  NSLog(@"didReceiveRemoteNotification userInfo= %@", userInfo);
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
}
// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  NSInteger badgeNUmber = RCTSharedApplication().applicationIconBadgeNumber;
  NSString *bagdeStr = [NSString stringWithFormat: @"%ld", badgeNUmber];
  NSLog(@"userNotificationCenter BadgeNumber = %@", bagdeStr);
  RCTSharedApplication().applicationIconBadgeNumber = -1;
  [RNPushNotification didReceiveNotificationResponse:response];
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center
      willPresentNotification:(UNNotification *)notification
        withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  // NSLog(@"userNotificationCenter notification=%@", notification);
  UNNotificationRequest* request = notification.request;
  NSString* indentifier = request.identifier;
  if ([indentifier isEqualToString:@"expiredNotification"] || [indentifier isEqualToString:@"missNotification"] ) {
    completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
    return;
  }
  UIApplicationState state = [[UIApplication sharedApplication] applicationState];
  if (state == UIApplicationStateBackground) {
    completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
    NSLog(@"UIApplicationStateBackground");
  } else {
    NSLog(@"UIApplicationStateForeground");
  }
}

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
  
}

- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    self.contentHandler(self.bestAttemptContent);
}

@end

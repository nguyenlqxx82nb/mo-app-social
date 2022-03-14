//
//  InstanceManager.h
//  StringeeVoiceCallSDK
//
//  Created by Hoang Duoc on 9/28/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>
// #import "HomeViewController.h"
#import "CallingViewController.h"
#import "CallManager.h"

@interface InstanceManager : NSObject

+ (InstanceManager *)instance;

@property(strong, nonatomic) CallingViewController *callingViewController;
@property(strong, nonatomic) CallManager *callManager;

@property (strong, nonatomic) NSData *deviceToken;
@property (assign, nonatomic) BOOL hasRegisteredToReceivePush;

@end

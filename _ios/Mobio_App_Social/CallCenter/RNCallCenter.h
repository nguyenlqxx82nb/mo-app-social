//
//  RNCallCenter.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/6/21.
//

#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import "RoundedButton.h"
#import <React/RCTEventEmitter.h>

@interface RNCallCenter : RCTEventEmitter <RCTBridgeModule>
 
- (void) initAndConnectStringee: (NSString*) token;

@end

//
//  CallUtils.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/20/21.
//

#import <Foundation/Foundation.h>

@interface CallUtils : NSObject

+ (BOOL) checkIfAccessTokenExpired: (NSString*) accessToken;
+ (NSString*) formatPhone: (NSString*) phone;
+ (NSString *)convertDataToHexStr:(NSData *)data;
+ (BOOL) isNull: (id) object;
+ (void) delayCallback:(void(^)(void))callback forTotalSeconds:(double)delayInSeconds;
+ (NSString*) getAccessToken;
+ (void) fetchAccessToken;

@end

//
//  MoFingerprint.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 7/1/21.
//

#ifndef MoFingerprint_h
#define MoFingerprint_h

#if __has_include(<React/RCTBridgeModule.h>) // React Native >= 0.40
#import <React/RCTBridgeModule.h>
#else // React Native < 0.40
#import "RCTBridgeModule.h"
#endif
#import <LocalAuthentication/LocalAuthentication.h>

@interface MoFingerprint : NSObject <RCTBridgeModule>
  - (NSString *_Nonnull)getBiometryType:(LAContext *_Nonnull)context;
@end

#endif /* MoFingerprint_h */

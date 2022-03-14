//
//  CallKitCall.h
//  CallkitSample
//
//  Created by Lê Quang Nguyên on 2/10/21.
//  Copyright © 2021 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>
#import <Stringee/Stringee.h>

@interface CallKitCall : NSObject
  @property (strong, nonatomic) NSString* callId;
  @property (strong, nonatomic) StringeeCall* stringeeCall;
  @property (assign, nonatomic) int serial;
  @property (strong, nonatomic) NSUUID* uuid;
  @property (assign, nonatomic) BOOL answered;
  @property (assign, nonatomic) BOOL rejected;
  @property (assign, nonatomic) BOOL audioIsActived;
  @property (assign, nonatomic) BOOL isIncoming;
  @property (strong, nonatomic) CXAnswerCallAction* answerAction;
  
- (id)initWidthParams: (BOOL)isIncoming andEnableTimer: (BOOL) enableTimer;
- (void)startTimer;
- (void)stopTimer;
- (void)clean;
- (void)checkTimeOut;

@end

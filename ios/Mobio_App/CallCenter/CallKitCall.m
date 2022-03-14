//
//  CallKitCall.m
//  CallkitSample
//
//  Created by Lê Quang Nguyên on 2/10/21.
//  Copyright © 2021 Hoang Duoc. All rights reserved.
//

#import "CallKitCall.h"
#import "CallManager.h"

@implementation CallKitCall {
  int counter;
  NSTimer* timeoutTimer;
}

- (id)init {
  self = [super init];
  if (self) {
  }
  return self;
}

- (id)initWidthParams:(BOOL)isIncoming andEnableTimer:(BOOL)enableTimer {
  self = [super init];
  self.isIncoming = isIncoming;
//  if (enableTimer) {
//    [self startTimer];
//  }
  return self;
}

- (void)startTimer {
  counter = 0;
  timeoutTimer = [NSTimer scheduledTimerWithTimeInterval:2 target:self selector:@selector(checkTimeOut) userInfo:nil repeats:YES];
  [[NSRunLoop currentRunLoop] addTimer:timeoutTimer forMode:NSDefaultRunLoopMode];
}

- (void)stopTimer {
  CFRunLoopStop(CFRunLoopGetCurrent());
  if (timeoutTimer != nil) {
    [timeoutTimer invalidate];
    timeoutTimer = nil;
  }
  counter = 0;
  NSLog(@"call stopTimer");
}

- (void)clean {
  [self stopTimer];
}

- (void) checkTimeOut {
  counter += 2;
  if (counter > 28) {
    [self stopTimer];
    NSLog(@"Xay ra timeout call %i rejected = %@ answered=%@",counter , self.rejected ? @"YES" : @"NO",  self.answered ? @"YES" : @"NO");
    if (!self.answered && !self.rejected) {
      [[CallManager sharedInstance] endCall];
    }
  }
}

- (void) dealloc {
  NSLog(@"call dealloc");
  [self clean];
}

@end


#import "CallControl.h"

@implementation CallControl {
}

- (id) init {
    self = [super init];
    self.isIncoming = false;
    return self;
}

- (NSString*) displayName {
  return self.isIncoming ? self.from : self.to;
}

@end

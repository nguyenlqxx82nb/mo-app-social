//
//  RoundButton.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/15/21.
//

#import <Foundation/Foundation.h>
#import "RoundedButton.h"

@implementation RoundedButton {
    BOOL _highlighted;
}

@dynamic borderColor,borderWidth,cornerRadius;

@synthesize selected = _selected;

- (id)initWithCoder:(NSCoder *)aDecoder {
    self = [super initWithCoder:aDecoder];
    if(self != nil) {
      self.highlightOpacity = 1;
    }
    return self;
}

- (void)setSelected:(BOOL)selected
{
    if (_selected != selected) {
        _selected = selected;
        [self setNeedsDisplay];
    }
    // NSLog(@"setSelected selected state = %@", _selected ? @"TRUE" : @"FALSE");
    // [self drawRect:<#(CGRect)#>];
}

- (void)setHighlighted:(BOOL)highlighted {
    // NSLog(@"setHighlighted selected state = %@", highlighted ? @"TRUE" : @"FALSE");
    [super setHighlighted:highlighted];
    _highlighted = highlighted;
    if (highlighted) {
      [self.layer setBackgroundColor:self.highlightedBackgroundColor ? self.highlightedBackgroundColor.CGColor : self.normalBackgroundColor.CGColor];
      [self.layer setOpacity: self.highlightOpacity];
    } else {
      [self.layer setBackgroundColor:self.normalBackgroundColor.CGColor];
      [self.layer setOpacity: 1];
    }
}

-(void)setBorderColor:(UIColor *)borderColor{
    [self.layer setBorderColor:borderColor.CGColor];
    // [self.layer setBorderColor:borderColor.CGColor forState:];
}

-(void)setBorderWidth:(CGFloat)borderWidth{
    [self.layer setBorderWidth:borderWidth];
}

-(void)setCornerRadius:(CGFloat)cornerRadius{
    [self.layer setCornerRadius:cornerRadius];
  [self.layer setOpacity:2];
}

// -(void)

- (void)drawRect:(CGRect)rect
{
    // NSLog(@"drawRect selected state = %@", _selected ? @"TRUE" : @"FALSE");
    if (_highlighted) {
      [self.layer setBackgroundColor:self.highlightedBackgroundColor ? self.highlightedBackgroundColor.CGColor : self.normalBackgroundColor.CGColor];
    } else {
        [self.layer setBackgroundColor:self.normalBackgroundColor.CGColor];
    }
}

@end

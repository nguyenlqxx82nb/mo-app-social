//
//  NumberPadView.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/22/21.
//

#import "NumberPadView.h"
#import "CallUtils.h"
#import "CallManager.h"
#import <Stringee/Stringee.h>

@implementation NumberPadView {
  NSInteger height;
}

// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
  NSString* fontMedium = @"SFProText-Medium";
  //NSString* fontRegular = @"SFProText-Regular";
  NSString* fontBold = @"SFProText-Bold";
  
  UIColor* primaryColor = [UIColor colorWithRed:0.00 green:0.61 blue:0.86 alpha:1];
  UIColor* textColor = [UIColor colorWithRed:0.31 green:0.31 blue:0.31 alpha:1];
  UIColor* redColor = [UIColor colorWithRed:1 green:0.33 blue:0.33 alpha:1];
  
  [self.btn1.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn1.titleLabel setTextColor:textColor];
  [self.btn2.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn2.titleLabel setTextColor:textColor];
  [self.btn3.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn3.titleLabel setTextColor:textColor];
  [self.btn4.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn4.titleLabel setTextColor:textColor];
  [self.btn5.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn5.titleLabel setTextColor:textColor];
  [self.btn6.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn6.titleLabel setTextColor:textColor];
  [self.btn7.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn7.titleLabel setTextColor:textColor];
  [self.btn8.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn8.titleLabel setTextColor:textColor];
  [self.btn9.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn9.titleLabel setTextColor:textColor];
  [self.btn0.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn0.titleLabel setTextColor:textColor];
  [self.btn11.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn11.titleLabel setTextColor:textColor];
  [self.btn12.titleLabel setFont:[UIFont fontWithName:fontMedium size:25]];
  [self.btn12.titleLabel setTextColor:textColor];
  
  //self.contentView.layer.corner
  [self.lblResult setFont:[UIFont fontWithName:fontBold size:25]];
  [self.lblResult setTextColor:textColor];
  
  self.contentView = [self roundCornersOnView:self.contentView onTopLeft:YES topRight:YES bottomLeft:NO bottomRight:NO radius:20];
}

- (instancetype)initWithCoder:(NSCoder *)coder
{
  self = [super initWithCoder:coder];
  if (self) {
    [self customInit];
  }
  return self;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    [self customInit];
  }
  return self;
}

-(void)customInit
{
  [[NSBundle mainBundle] loadNibNamed:@"NumberPadView" owner:self options:nil];
  [self addSubview:self.contentView];
  self.contentView.frame = self.bounds;
  UIWindow *window = UIApplication.sharedApplication.keyWindow;
  NSInteger bottom = 0;
  if (@available(iOS 11, *)) {
    bottom = (NSInteger)window.safeAreaInsets.bottom;
  }
  CGSize size = [[UIScreen mainScreen] bounds].size;
  height = 470 + bottom;
  [UIView animateWithDuration:0.25
                        delay:0.1
                      options: UIViewAnimationOptionCurveEaseIn
                   animations:^{
                      self.frame = CGRectMake(0, size.height - height, size.width, height);
                   }
                   completion:^(BOOL finished){
                   }];
}

- (IBAction)btn1Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@1",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFOne];
}

- (IBAction)btn2Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@2",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFTwo];
}

- (IBAction)btn3Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@3",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFThree];
}

- (IBAction)btn4Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@4",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFFour];
}

- (IBAction)btn5Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@5",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFFive];
}

- (IBAction)btn6Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@6",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFSix];
}

- (IBAction)btn7Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@7",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFSeven];
}

- (IBAction)btn8Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@8",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFEight];
}

- (IBAction)btn9Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@9",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFNine];
}

- (IBAction)btn0Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@0",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFZero];
}

- (IBAction)btn11Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@*",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFStar];
}

- (IBAction)btn12Tapped:(UIButton *)sender {
  NSString* prevText = self.lblResult.text;
  NSString* currText = [NSString stringWithFormat:@"%@#",prevText];
  self.lblResult.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFPound];
}

- (IBAction)btnCloseTapped:(UIButton *)sender {
  CGSize size = [[UIScreen mainScreen] bounds].size;
  [UIView animateWithDuration:0.25
                        delay:0.1
                      options: UIViewAnimationOptionCurveEaseIn
                   animations:^{
                    self.frame = CGRectMake(0, size.height, size.width, height);
                   }
                   completion:^(BOOL finished){
                    [CallUtils delayCallback:^{
                      [self removeFromSuperview];
                    } forTotalSeconds:0.1];
                   }];
  [self.delegate closeNumberPadView];
}

- (UIView *)roundCornersOnView:(UIView *)view onTopLeft:(BOOL)tl topRight:(BOOL)tr bottomLeft:(BOOL)bl bottomRight:(BOOL)br radius:(float)radius {

    if (tl || tr || bl || br) {
        UIRectCorner corner = 0;
        if (tl) {corner = corner | UIRectCornerTopLeft;}
        if (tr) {corner = corner | UIRectCornerTopRight;}
        if (bl) {corner = corner | UIRectCornerBottomLeft;}
        if (br) {corner = corner | UIRectCornerBottomRight;}

        UIView *roundedView = view;
        UIBezierPath *maskPath = [UIBezierPath bezierPathWithRoundedRect:roundedView.bounds byRoundingCorners:corner cornerRadii:CGSizeMake(radius, radius)];
        CAShapeLayer *maskLayer = [CAShapeLayer layer];
        maskLayer.frame = roundedView.bounds;
        maskLayer.path = maskPath.CGPath;
        roundedView.layer.mask = maskLayer;
        return roundedView;
    }
    return view;
}
@end

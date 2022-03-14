//
//  AssignViewController.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 4/15/21.
//

#import <Foundation/Foundation.h>
#import "AssignView.h"
#import "CallUtils.h"
#import "UIView+Toast.h"

@implementation AssignView {
  NSInteger height;
  UITableView *tableView;
  NSArray* assignData;
  NSInteger selectedIndex;
  NSString* mCallId;
}

- (void)drawRect:(CGRect)rect {
    // Drawing code
  NSString* fontMedium = @"SFProText-Medium";
  // NSString* fontBold = @"SFProText-Bold";
  
  // UIColor* primaryColor = [UIColor colorWithRed:0.00 green:0.61 blue:0.86 alpha:1];
  UIColor* textColor = [UIColor colorWithRed:0.31 green:0.31 blue:0.31 alpha:1];
  UIColor* whiteColor = [UIColor colorWithRed:1 green:1 blue:1 alpha:1];
  
  [self.btnCall.titleLabel setFont:[UIFont fontWithName:fontMedium size:15]];
  [self.btnCall.titleLabel setTextColor:whiteColor];
  
  [self.lblTitle setFont:[UIFont fontWithName:fontMedium size:15]];
  [self.lblTitle setTextColor:whiteColor];
  
  self.containerView = [self roundCornersOnView:self.containerView onTopLeft:YES topRight:YES bottomLeft:NO bottomRight:NO radius:20];
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
  [[NSBundle mainBundle] loadNibNamed:@"AssignView" owner:self options:nil];
  [self addSubview:self.containerView];
  self.containerView.frame = self.bounds;
  UIWindow *window = UIApplication.sharedApplication.keyWindow;
  NSInteger bottom = 0;
  if (@available(iOS 11, *)) {
    bottom = (NSInteger)window.safeAreaInsets.bottom;
  }
  CGSize size = [[UIScreen mainScreen] bounds].size;
  height = 435; //+ bottom;
  
  // init blur background
  [self initBlurBackground];
  // init table
  [self initTable];
  
  [UIView animateWithDuration:0.25
                        delay:0.1
                      options: UIViewAnimationOptionCurveEaseIn
                   animations:^{
                      self.frame = CGRectMake(0, size.height - height, size.width, height);
                   }
                   completion:^(BOOL finished){
                   }];
}

- (void) initBlurBackground {
  if (!UIAccessibilityIsReduceTransparencyEnabled()) {
      self.containerView.backgroundColor = [UIColor clearColor];

      UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleDark];
      UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
      //always fill the view
      blurEffectView.frame = self.containerView.bounds;
      blurEffectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    [self.containerView insertSubview:blurEffectView atIndex:0]; //if you have more UIViews, use an insertSubview API to place it where needed
  } else {
      self.containerView.backgroundColor = [UIColor blackColor];
  }
}

- (void) initTable {
  self.listView.layer.cornerRadius = 10;
  assignData = @[];
  selectedIndex = -1;
  UIColor* whiteColor = [UIColor colorWithRed:1 green:1 blue:1 alpha:1];
  tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 20, self.containerView.bounds.size.width - 34, 225)];
  [tableView registerNib:[UINib nibWithNibName:@"AssignTableViewCell" bundle:nil]  forCellReuseIdentifier:@"AssignCell"];
  [tableView setDataSource:self];
  [tableView setDelegate:self];
  [tableView setShowsVerticalScrollIndicator:NO];
  [tableView setSeparatorStyle:NO];
  [tableView setBackgroundColor:whiteColor];
  tableView.separatorInset = UIEdgeInsetsZero;
  tableView.layoutMargins = UIEdgeInsetsZero;
  tableView.translatesAutoresizingMaskIntoConstraints = NO;
  tableView.rowHeight = 45;
  
  [self.listView addSubview:tableView];
  // [test didMoveToParentViewController:self];
  [self fetchAssignGroups];
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

- (IBAction)btnCloseTapped:(UIButton *)sender {
  [self close];
}

- (void) close {
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
}

- (IBAction)btnAssignTapped:(UIButton *)sender {
  if (selectedIndex < 0) {
    [self.contentView makeToast:@"Bạn vui lòng chọn nhóm trước khi chuyển tiếp!"
                      duration:1.0f
                      position:CSToastPositionBottom];
  } else {
    NSString* thirdId = assignData[selectedIndex][@"third_party_id"];
    NSString* groupName = assignData[selectedIndex][@"mobio_name"];
    
    NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
    NSString* host = [prefs valueForKey:@"HOST_CALL_CENTER"];
    NSString* merchantId = [prefs valueForKey:@"MERCHANT_ID"];
    NSString* token = [prefs valueForKey:@"TOKEN"];
    NSString* urlString = [NSString stringWithFormat:@"%@setting/call/transfer", host];
    token = [NSString stringWithFormat:@"Bearer %@", token];
    NSURL *url = [NSURL URLWithString:urlString];
    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setValue:token forHTTPHeaderField:@"Authorization"];
    [request setValue:merchantId forHTTPHeaderField:@"X-Merchant-ID"];
    
    NSMutableDictionary *contentDictionary = [[NSMutableDictionary alloc]init];
    [contentDictionary setValue:mCallId forKey:@"call_id"];
    [contentDictionary setValue:thirdId forKey:@"to_number"];
    [contentDictionary setValue:@"queue" forKey:@"to_type"];
    [contentDictionary setValue:@"blind" forKey:@"transfer_type"];
    
    NSData *data = [NSJSONSerialization dataWithJSONObject:contentDictionary options:NSJSONWritingPrettyPrinted error:nil];
    NSString *postLength = [NSString stringWithFormat:@"%d", [data length]];
    [request setValue:postLength forHTTPHeaderField:@"Content-Length"];

    NSString *jsonStr = [[NSString alloc] initWithData:data
                                              encoding:NSUTF8StringEncoding];
    NSLog(@"btnAssignTapped urlString %@ , jsonStr = %@ postLength = %@ ",urlString, jsonStr, postLength);
    [request setHTTPBody:data];
    [[[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:
      ^(NSData * _Nullable data,
        NSURLResponse * _Nullable response,
        NSError * _Nullable error) {
      if (error) {
        NSLog(@"btnAssignTapped error = %@", error);
        return;
      }
      NSError *jsonError = nil;
      NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
      NSLog(@"btnAssignTapped data = %@", dictionary);
      
      long code = [dictionary[@"code"] integerValue];
      if (code == 200) {
        
        dispatch_async(dispatch_get_main_queue(), ^{
          [self.delegate didAssignToGroup:groupName];
          [self close];
        });
      }
    }] resume];
  }
  
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  NSInteger count = [assignData count];
    // Return the number of rows in the section.
  NSLog(@"tableView numberOfRowsInSection count = %@",[[NSNumber numberWithInt:count] stringValue]);
  return count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    AssignTableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"AssignCell" forIndexPath:indexPath];
    //int dataIndex = (int) indexPath.row % [self.bodyArray count];
    cell.lblName.text =  assignData[indexPath.row][@"mobio_name"];
    [cell setNeedsUpdateConstraints];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  // NSLog(@"didSelectRowAtIndexPath indexPath = %@ ", [[NSNumber numberWithInt:indexPath.row] stringValue]);
  selectedIndex = indexPath.row;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 45;
}

- (CGFloat)tableView:(UITableView *)tableView estimatedHeightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 45;
}

- (void) fetchAssignGroups {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* host = [prefs valueForKey:@"HOST_CALL_CENTER"];
  NSString* merchantId = [prefs valueForKey:@"MERCHANT_ID"];
  NSString* token = [prefs valueForKey:@"TOKEN"];
  NSString* urlString = [NSString stringWithFormat:@"%@setting/queue?transfer_call=allow", host];
  token = [NSString stringWithFormat:@"Bearer %@", token];
  NSURL *url = [NSURL URLWithString:urlString];
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

  [request setHTTPMethod:@"GET"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  [request setValue:token forHTTPHeaderField:@"Authorization"];
  [request setValue:merchantId forHTTPHeaderField:@"X-Merchant-ID"];

  [[[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:
    ^(NSData * _Nullable data,
      NSURLResponse * _Nullable response,
      NSError * _Nullable error) {
    if (error) {
      NSLog(@"fetchAssignGroups error = %@", error);
      return;
    }
    NSError *jsonError = nil;
    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
    long code = [dictionary[@"code"] integerValue];
    if (code == 200) {
      assignData = dictionary[@"data"];
      dispatch_async(dispatch_get_main_queue(), ^{
        [tableView reloadData];
      });
    }
  }] resume];
}

- (void) setCallId:(NSString*)callId {
  mCallId = callId;
}

@end


#import "CallingViewController.h"
#import "StringeeImplement.h"
#import "InstanceManager.h"
#import "CallUtils.h"
#import "UIView+Toast.h"
#import <UserNotifications/UserNotifications.h>

static int TIME_WINDOW = 2;
static int CALL_TIME_OUT = 90; // giây

typedef enum CallScreenType {
  outgoing,
  incoming,
  calling
} CallScreenType ;


@interface CallingViewController ()

@end

@implementation CallingViewController {
  NSTimer *timer;
  NSTimer *reportTimer;
  NumberPadView* padView;
  BOOL isMute;
  BOOL isSpeaker;
  
  // Stats report
  long long audioBw;
  double audioPLRatio;
  long long prevAudioPacketLost;
  long long prevAudioPacketReceived;
  double prevAudioTimeStamp;
  long long prevAudioBytes;
  
  BOOL isDecline;
  BOOL hasCreatedCall;
  BOOL hasAnsweredCall;
  BOOL hasConnectedMedia;
  
  NSTimer *timeoutTimer;
  int interval;
  
}

- (instancetype)initWithParams:(NSString*)name andControl:(CallControl*)control andCall:(StringeeCall*)call
{
  self = [super initWithNibName:name bundle: nil];
  if (self) {
    self.callControl = control;
    [InstanceManager instance].callingViewController = self;
    // Lưu thông tin vào call control
    if (call) {
      call.delegate = self;
      self.call = call;
      self.callControl.from = call.from;
      self.callControl.to = call.to;
      self.callControl.username = call.fromAlias;
      self.callControl.isAppToPhone = true;
      self.callControl.callId = call.callId;
    }
    self.callControl.isIncoming = call ? true : false;
  }
  return self;
}


- (void)viewDidLoad {
  [super viewDidLoad];
  [self setNeedsStatusBarAppearanceUpdate];
  // [self setBarStyle];
  [[UIDevice currentDevice] setProximityMonitoringEnabled:YES];
  [self setupUI];
  NSString* phone = self.callControl.isIncoming ? self.call.from : self.call.to;
  [self fetchProfile:phone];
  if (!self.call) {
    NSString* from = self.callControl.from;
    NSString* to = self.callControl.to;
    NSLog(@"makeCallWithCompletionHandler from= %@, to=%@", from, to);
    self.call = [[StringeeCall alloc] initWithStringeeClient:[StringeeImplement instance].stringeeClient from:from to:to];
    self.call.delegate = self;
    self.call.isVideoCall = false;
    self.callControl.callId = self.call.callId;
    CallManager* callManager = [CallManager sharedInstance];
    [self.call makeCallWithCompletionHandler:^(BOOL status, int code, NSString *message, NSString *data) {
      NSLog(@"makeCallWithCompletionHandler %@", message);
      if (!status) {
        // Nếu make call không thành công thì kết thúc cuộc gọi
        [self endCallAndDismissWithTitle:@"Cuộc gọi không thành công"];
      } else {
        if (callManager != nil) {
          [callManager makeCall:to calleeName:to stringeCall:self.call];
        }
      }
    }];
  }
   // Bắt đầu check timeout cho cuộc gọi
  timeoutTimer = [NSTimer scheduledTimerWithTimeInterval:2 target:self selector:@selector(checkCallTimeOut) userInfo:nil repeats:YES];
  [[NSRunLoop currentRunLoop] addTimer:timeoutTimer forMode:NSDefaultRunLoopMode];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
}

-(void) viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
}

-(void) viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
}

- (UIStatusBarStyle)preferredStatusBarStyle {
  // NSLog(@"preferredStatusBarStyle = %@", @"hello");
  return UIStatusBarStyleLightContent;
}

//- (void) setBarStyle {
//  [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleLightContent animated:NULL];
//}

- (void) setupUI {
  NSLog(@"setupUI displayName= %@", [self.callControl displayName]);
  
  NSString* fontMedium = @"SFProText-Medium";
  NSString* fontRegular = @"SFProText-Regular";
//  NSString* fontBold = @"SFProText-Bold";
  
  UIColor* primaryColor = [UIColor colorWithRed:0.00 green:0.61 blue:0.86 alpha:1];
  UIColor* textColor = [UIColor colorWithRed:0.31 green:0.31 blue:0.31 alpha:1];
  UIColor* redColor = [UIColor colorWithRed:1 green:0.33 blue:0.33 alpha:1];
  UIColor* whiteColor = [UIColor colorWithRed:1 green:1 blue:1 alpha:1];
  
  // self.imageAvatar = [[UIImage alloc] initWithData:data];
  self.avatarImg.image = [UIImage imageNamed:@"avatar" ];
  self.avatarImg.layer.cornerRadius = self.avatarImg.frame.size.width / 2 ;
  self.avatarImg.clipsToBounds = YES;
  [self.avatarImg.layer setBorderColor: [whiteColor CGColor]];
  [self.avatarImg.layer setBorderWidth: 2.0];
  
  [self.lblTop setFont:[UIFont fontWithName:fontRegular size:13]];
  [self.lblTop setTextColor:whiteColor];
  
  [self.lblName setFont:[UIFont fontWithName:fontMedium size:17]];
  [self.lblName setTextColor:whiteColor];
  
  [self.lblState setFont:[UIFont fontWithName:fontRegular size:13]];
  [self.lblState setTextColor:whiteColor];
  
  [self.lblEnd setFont:[UIFont fontWithName:fontRegular size:13]];
  [self.lblEnd setTextColor:redColor];
  
  [self.lblPad setFont:[UIFont fontWithName:fontMedium size:13]];
  [self.lblPad setTextColor:whiteColor];
  
  [self.lblAssign setFont:[UIFont fontWithName:fontMedium size:13]];
  [self.lblAssign setTextColor:whiteColor];
  
  [self.lblSpeaker setFont:[UIFont fontWithName:fontMedium size:13]];
  [self.lblSpeaker setTextColor:whiteColor];
  
  self.lblName.text = [CallUtils formatPhone:[self.callControl displayName]];
  self.lblState.text = self.callControl.isIncoming ? @"Đang gọi đến" : @"Đang gọi";
  [self updateScreen];
  [self updateSpeaker:isSpeaker];
  
  if (self.callControl.isIncoming) {
    [self.btnPadNumber setHidden:YES];
    [self.lblPad setHidden:YES];
    
    [self.btnAssign setHidden:NO];
    [self.lblAssign setHidden:NO];
  } else {
    [self.btnPadNumber setHidden:NO];
    [self.lblPad setHidden:NO];
    
    [self.btnAssign setHidden:YES];
    [self.lblAssign setHidden:YES];
  }
  
  // add gradient background
  [self addGradientBackground];
  // init number pad ui
  [self initPadNumberUI];
  
  // fix constraint
  if ([[UIScreen mainScreen] bounds].size.height < 680) {
    [self.avatarImg.topAnchor constraintEqualToAnchor:self.lblTop.bottomAnchor constant:20.0].active = YES;
  }
}

- (void) addGradientBackground {
  UIColor *leftColor = [UIColor colorWithRed:58.0/255.0 green:66.0/255.0 blue:213.0/255.0 alpha:1.0];
  UIColor *middleColor = [UIColor colorWithRed:30.0/255.0 green:90.0/255.0 blue:210.0/255.0 alpha:1.0];
  UIColor *rightColor = [UIColor colorWithRed:0.0/255.0 green:156.0/255.0 blue:219.0/255.0 alpha:1.0];
  // Create the gradient
  CAGradientLayer *theViewGradient = [CAGradientLayer layer];
  theViewGradient.colors = [NSArray arrayWithObjects: (id)leftColor.CGColor, (id)middleColor.CGColor,(id)rightColor.CGColor, nil];
  theViewGradient.frame = [[UIScreen mainScreen] bounds];
//  NSLog(@"didHandleOnAnotherDevice height = %ld, width = ld%, hs=%ld , ws=%ld", (long)self.containerView.bounds.size.height,
//      (long)self.containerView.bounds.size.width,
//       (long)theViewGradient.frame.size.height,
//        (long)theViewGradient.frame.size.width);
  //Add gradient to view
  [self.containerView.layer insertSublayer:theViewGradient atIndex:0];
}

- (void) initPadNumberUI {
  // NSString* fontMedium = @"SFProText-Medium";
  NSString* fontRegular = @"SFProText-Regular";
  
  [self.btnPad0.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad1.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad2.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad3.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad4.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad5.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad6.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad7.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad8.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad9.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad10.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  [self.btnPad11.titleLabel setFont:[UIFont fontWithName:fontRegular size:22]];
  
  [self.lblPadNumber setFont:[UIFont fontWithName:fontRegular size:24]];
}

- (IBAction)btnPad1Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@1",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFOne];
}

- (IBAction)btnPad2Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@2",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFTwo];
}

- (IBAction)btnPad3Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@3",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFThree];
}

- (IBAction)btnPad4Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@4",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFFour];
}

- (IBAction)btnPad5Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@5",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFFive];
}

- (IBAction)btnPad6Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@6",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFSix];
}

- (IBAction)btnPad7Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@7",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFSeven];
}

- (IBAction)btnPad8Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@8",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFEight];
}

- (IBAction)btnPad9Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@9",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFNine];
}

- (IBAction)btnPad0Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@0",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFZero];
}

- (IBAction)btnPad10Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@*",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFStar];
}

- (IBAction)btnPad11Tapped:(UIButton *)sender {
  NSString* prevText = self.lblPadNumber.text;
  NSString* currText = [NSString stringWithFormat:@"%@#",prevText];
  self.lblPadNumber.text = currText;
  [[CallManager sharedInstance] sendDTMF:CallDTMFPound];
}

- (void) updateScreen {
  NSLog(@"VC updateScreen");
  dispatch_async(dispatch_get_main_queue(), ^{
    switch ([self screenType]) {
      case incoming:
        self.btnReject.hidden = NO;
        self.btnAnswer.hidden = NO;
        self.btnHangup.hidden = YES;
        break;
      case outgoing:
        self.btnReject.hidden = YES;
        self.btnAnswer.hidden = YES;
        self.btnHangup.hidden = NO;
        break;
      case calling:
        self.btnReject.hidden = YES;
        self.btnAnswer.hidden = YES;
        self.btnHangup.hidden = NO;
        break;
    }
  });
}

- (CallScreenType) screenType {
  CallScreenType screenType;
  if (self.callControl.signalingState ==  SignalingStateAnswered) {
    screenType = calling;
  } else {
    screenType = self.callControl.isIncoming ? incoming : outgoing ;
  }
  
  return screenType ;
}

- (void) fetchProfile:(NSString *) phone {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* host = [prefs valueForKey:@"HOST_PROFILING"];
  NSString* merchantId = [prefs valueForKey:@"MERCHANT_ID"];
  NSString* token = [prefs valueForKey:@"TOKEN"];
  NSString* urlString = [NSString stringWithFormat:@"%@search-users?lang=vi&query=%@&merchant_id=%@", host, phone, merchantId];
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
      return;
    }
    
    NSError *jsonError = nil;
    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
    
    long code = [dictionary[@"code"] integerValue];
    if (code != 200) {
      return;
    }
    NSArray* customers = [dictionary valueForKeyPath:@"customers"];
    if (!customers || customers.count == 0) {
      return;
    }
    NSDictionary* cus = customers[0];
    NSString* avatar = cus[@"avatar"];
    NSString* name = cus[@"name"];
    NSString* _id = cus[@"id"];
    // NSLog(@"")
    self.callControl.username = name;
    self.callControl.userAvatar = avatar;
    self.callControl.userId = _id;
    
    dispatch_async(dispatch_get_main_queue(), ^{
      if (![CallUtils isNull:name]) {
        //NSLog(@"fetch profile name = %@", name);
        self.lblName.text = name;
      }
      if (![CallUtils isNull:avatar]) {
        NSURL *url = [NSURL URLWithString:avatar];
        NSData *data = [NSData dataWithContentsOfURL:url];
        UIImage *img = [[UIImage alloc] initWithData:data];
        self.avatarImg.image = img;
      }
    });
    
    // NSLog(@"fetch profile cus = %@ avatar = %@, name = %@, _id = %@", cus, avatar, name, _id);
  }] resume];
}

- (void)fetchFromPhone {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* host = @"https://api.stringee.com/v1/";// [prefs valueForKey:@"HOST_CALL_CENTER"];
  NSString* token = [prefs valueForKey:@"ACCESS_AGENT_TOKEN"];
  NSString* urlString = [NSString stringWithFormat:@"%@call/log", host];
  NSURL *url = [NSURL URLWithString:urlString];
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];
  [request setHTTPMethod:@"GET"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  [request setValue:token forHTTPHeaderField:@"X-STRINGEE-AUTH"];
  // NSLog(@"fetchFromPhone urlString=%@, token=%@",urlString, token);
  [[[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:
    ^(NSData * _Nullable data,
      NSURLResponse * _Nullable response,
      NSError * _Nullable error) {
    if (error) {
      NSLog(@"fetchFromPhone ERROR=%@",error);
      return;
    }
    
    NSError *jsonError = nil;
    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
    long code = [dictionary[@"r"] integerValue];
    // NSLog(@"fetchFromPhone data = %@ , code=%ld, calls=%@", dictionary[@"data"], code, calls);
    if (code != 0) {
      return;
    }
    NSArray* calls = dictionary[@"data"][@"calls"];
    if (!calls || calls.count == 0) {
      return;
    }
    NSDictionary* call = calls[0];
    NSString* callee = call[@"callee"];
    NSString* from_number = call[@"from_number"];
    
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString* fromPhone = ![CallUtils isNull:callee] ? callee : ![CallUtils isNull:from_number] ? from_number : nil;
      if (fromPhone != nil) {
        NSString* topText = [NSString stringWithFormat:@"Tổng đài gọi ra: %@", [CallUtils formatPhone:fromPhone]];
        [self.lblTop setText:topText];
      }
    });
  }] resume];
}

//MARK: -  Action

- (IBAction)assignTapped:(UIButton *)sender {
  NSLog(@"assignTapped");
  if (!self.callControl.isIncoming || self.callControl.signalingState !=  SignalingStateAnswered) {
    [self.contentView makeToast:@"Chức năng chỉ được sử dụng khi bạn đang nghe cuộc gọi đến."
                      duration:1.0f
                      position:CSToastPositionBottom];
    return;
  }
  
  CGSize size = [[UIScreen mainScreen] bounds].size;
  AssignView* assignView = [[AssignView alloc] initWithFrame:CGRectMake(0,size.height,size.width,435)];
  [assignView setCallId:self.callControl.callId];
  assignView.delegate = self;
  [self.contentView addSubview:assignView];
}

- (void) didAssignToGroup:(NSString*)groupName {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.contentView makeToast: [NSString stringWithFormat:@"Cuộc gọi đã được chuyển tiếp tới nhóm %@", groupName]
                      duration:2.0f
                      position:CSToastPositionBottom];
  });
}

- (IBAction)endCallTapped:(UIButton *)sender {
  [[CallManager sharedInstance] hangup: nil];
}

- (IBAction)muteTapped:(UIButton *)sender {
}

- (IBAction)speakerTapped:(UIButton *)sender {
  if (isSpeaker) {
    isSpeaker = NO;
  } else {
    isSpeaker = YES;
  }
  [self updateSpeaker:isSpeaker];
}

- (void) updateSpeaker: (BOOL) isSpeakerOn {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!isSpeakerOn) {
      self.btnSpeaker.hidden = NO;
      self.btnSpeakerOn.hidden = YES;
      [[StringeeAudioManager instance] setLoudspeaker:NO];
    } else {
      self.btnSpeaker.hidden = YES;
      self.btnSpeakerOn.hidden = NO;
      [[StringeeAudioManager instance] setLoudspeaker:YES];
    }
  });
}

- (IBAction)acceptTapped:(UIButton *)sender {
  [[CallManager sharedInstance] answerCall];
}

- (IBAction)declineTapped:(UIButton *)sender {
  [[CallManager sharedInstance] reject:nil];
}

- (IBAction)numberPadTapped:(UIButton *)sender {
  [self.controlView setHidden:YES];
  [self.padView setHidden:NO];
}

- (IBAction)callTapped:(UIButton *)sender {
  if (![InstanceManager instance].callingViewController) {
    return;
  }
  UIViewController *vc = self.presentingViewController;
  while (vc.presentingViewController) {
    vc = vc.presentingViewController;
  }
  [vc dismissViewControllerAnimated:NO completion:^{
    [InstanceManager instance].callingViewController = nil;
    NSLog(@"dismissViewControllerAnimated");
    if (self.callControl) {
      NSString* from = self.callControl.isIncoming ? self.callControl.to : self.callControl.from;
      NSString* to = self.callControl.isIncoming ? self.callControl.from : self.callControl.to;
      [[CallManager sharedInstance] callToPhone:from andToPhone:to];
    }
  }];
}

- (IBAction)callPhoneTapped:(UIButton *)sender {
  if (![InstanceManager instance].callingViewController) {
    return;
  }
  UIViewController *vc = self.presentingViewController;
  while (vc.presentingViewController) {
    vc = vc.presentingViewController;
  }
  [vc dismissViewControllerAnimated:NO completion:^{
    [InstanceManager instance].callingViewController = nil;
    NSLog(@"dismissViewControllerAnimated");
    if (self.callControl) {
      NSString* phone_number = [self.callControl.isIncoming ? self.callControl.from : self.callControl.to stringByReplacingOccurrencesOfString:@"84" withString:@"0"];
      NSLog(@"CALL TO PHONE %@", phone_number);
      NSString *phoneStr = [NSString stringWithFormat:@"tel:%@",phone_number];
      UIApplication *application = [UIApplication sharedApplication];
      [application openURL:[NSURL URLWithString: phoneStr] options:@{} completionHandler:nil];
    }
    
  }];
}

- (void) closeNumberPadView {
  NSLog(@"closeNumberPadView");
}


// MARK: - Handle Call
- (void)checkCallTimeOut {
  interval += 2;
  if (interval >= CALL_TIME_OUT && !timer) {
    NSLog(@"checkCallTimeOut timeout %i", interval);
    [[CallManager sharedInstance] hangup:nil];
    [self endCallAndDismissWithTitle:@"Không có phản hồi"];
  }
}

// Show thông báo và kết thúc cuộc gọi
- (void)endCallAndDismissWithTitle:(NSString *)title {
  dispatch_async(dispatch_get_main_queue(), ^{
    int time = self.timeMin*60 + self.timeSec;
    NSString* phone = self.callControl.isIncoming ? self.call.from : self.call.to;
    [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeEndCall" object:self userInfo:@{@"callId": self.callControl.callId,@"phoneNumber": phone, @"time": [NSString stringWithFormat:@"%i", time]}];
    self.lblEnd.text = title;
    self.lblState.alpha = 1;
    // [self.lblState setTextColor:redColor];
    [UIView animateWithDuration:0.5 delay:0.5 options:UIViewAnimationOptionRepeat | UIViewAnimationOptionAutoreverse animations:^{
      self.lblState.alpha = 0;
    } completion:nil];
    
    // self.view.userInteractionEnabled = NO;
    // self.endView.hidden = NO;
    self.bottomView.hidden = YES;
    self.controlView.hidden = YES;
    self.padView.hidden = YES;
    
    [[UIDevice currentDevice] setProximityMonitoringEnabled:NO];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVAudioSessionRouteChangeNotification object:nil];
    [self endStatsReports];
    
    // End callkit
    [[CallManager sharedInstance] endCall];
    [[CallManager sharedInstance] clean];
    
    [self stopTimer];
    [self stopTimeoutTimer];
    if (![InstanceManager instance].callingViewController) {
      return;
    }
    
    UIViewController *vc = self.presentingViewController;
    UIApplicationState state = [[UIApplication sharedApplication] applicationState];
    if (state != UIApplicationStateActive) {
      [vc dismissViewControllerAnimated:NO completion:^{
        [InstanceManager instance].callingViewController = nil;
      }];
      [InstanceManager instance].callingViewController = nil;
    } else {
      [self delayCallback:^{
        [vc dismissViewControllerAnimated:YES completion:^{}];
        [InstanceManager instance].callingViewController = nil;
      } forTotalSeconds:3];
    }
  });
}

// Thực hiện khối lệnh sau 1 khoảng thời gian
- (void)delayCallback:(void(^)(void))callback forTotalSeconds:(double)delayInSeconds {
  dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
  dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    if(callback){
      callback();
    }
  });
}

// MARK: - Handle Call

// Bắt đầu đếm thời gian cuộc gọi
- (void)startTimer {
  [self stopTimeoutTimer];
  if (!timer) {
    self.isCalling = YES;
    timer = [NSTimer scheduledTimerWithTimeInterval:1.0 target:self selector:@selector(timerTick:) userInfo:nil repeats:YES];
    [[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
    [timer fire];
  }
}

- (void)timerTick:(NSTimer *)timer
{
  self.timeSec++;
  if (self.timeSec == 60)
  {
    self.timeSec = 0;
    self.timeMin++;
  }
  NSString* timeNow = [NSString stringWithFormat:@"%02d:%02d", self.timeMin, self.timeSec];
  if (self.lblState.hidden) {
    self.lblState.hidden = NO;
  }
  self.lblState.text= timeNow;
}

// Kết thúc đếm thời gian cuộc gọi
- (void)stopTimer {
  CFRunLoopStop(CFRunLoopGetCurrent());
  [timer invalidate];
  timer = nil;
  NSString* timeNow = [NSString stringWithFormat:@"%02d:%02d", self.timeMin, self.timeSec];
  self.lblState.text= timeNow;
}

// MARK: - Check Internet Quality

// Bắt đầu kiểm tra chất lượng mạng
- (void)beginStatsReports {
  reportTimer = [NSTimer scheduledTimerWithTimeInterval:1.0 target:self selector:@selector(statsReport) userInfo:nil repeats:YES];
}

// Kết thúc kiểm tra chất lượng mạng
- (void)endStatsReports {
  [reportTimer invalidate];
  reportTimer = nil;
}

- (void)statsReport {
  [self.stringeeCall statsWithCompletionHandler:^(NSDictionary<NSString *,NSString *> *values) {
    [self checkAudioQualityWithStats:values];
  }];
}

// Đánh giá chất lượng mạng dựa trên các thông số
- (void)checkAudioQualityWithStats:(NSDictionary *)stats {
  
  NSTimeInterval audioTimeStamp = [[NSDate date] timeIntervalSince1970];
  
  NSNumber *byteReceived = [stats objectForKey:@"bytesReceived"];
  
  if (byteReceived.longLongValue != 0) {
    if (prevAudioTimeStamp == 0) {
      prevAudioTimeStamp = audioTimeStamp;
      
      prevAudioBytes = byteReceived.longLongValue;
    }
    
    if (audioTimeStamp - prevAudioTimeStamp > TIME_WINDOW) {
      
      // Tính tỉ lệ mất gói
      NSNumber *packetLost = stats[@"packetsLost"];
      NSNumber *packetsReceived = stats[@"packetsReceived"];
      
      if (prevAudioPacketReceived != 0) {
        long long pl = packetLost.longLongValue - prevAudioPacketLost;
        long long pr = packetsReceived.longLongValue - prevAudioPacketReceived;
        
        long long pt = pl + pr;
        
        if (pt > 0) {
          audioPLRatio = (double)pl / (double)pt;
        }
      }
      
      prevAudioPacketLost = packetLost.longLongValue;
      prevAudioPacketReceived = packetsReceived.longLongValue;
      
      // Tính băng thông video
      audioBw = (long long) ((8 * (byteReceived.longLongValue - prevAudioBytes)) / (audioTimeStamp - prevAudioTimeStamp));
      prevAudioTimeStamp = audioTimeStamp;
      prevAudioBytes = byteReceived.longLongValue;
      
      dispatch_async(dispatch_get_main_queue(), ^{
      });
      
    }
  }
}

// MARK: - Sound

- (void)startSound {
  
  if (@available(iOS 10, *)) {
    
  } else {
    NSString *soundFilePath;
    NSURL *soundFileURL;
    int loopIndex = 10;
    
    if (self.isIncomingCall) {
      soundFilePath = [[NSBundle mainBundle] pathForResource:@"incoming_call"  ofType:@"aif"];
      soundFileURL = [NSURL fileURLWithPath:soundFilePath];
      
      [self switchRouteTo:AVAudioSessionPortOverrideSpeaker];
      
      self.ringAudioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:soundFileURL error:nil];
      self.ringAudioPlayer.numberOfLoops = loopIndex;
      [self.ringAudioPlayer prepareToPlay];
      [self.ringAudioPlayer play];
    }
  }
}

- (void)stopSound {
  [self.ringAudioPlayer stop];
  self.ringAudioPlayer = nil;
}

- (void) stopTimeoutTimer {
  if (timeoutTimer != nil) {
    CFRunLoopStop(CFRunLoopGetCurrent());
    [timeoutTimer invalidate];
    timeoutTimer = nil;
  }
}

- (void)switchRouteTo:(AVAudioSessionPortOverride)port {
  NSError *error = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategorySoloAmbient error:&error];
  [session setActive: YES error:&error];
  
  [[AVAudioSession sharedInstance] overrideOutputAudioPort:port
                                                     error:&error];
  if(error)
  {
    NSLog(@"Error: AudioSession cannot use speakers");
  }
}

- (void) updateAnswerState {
  dispatch_async(dispatch_get_main_queue(), ^{
    // self.labelConnecting.text = @"Đang kết nối...";
    self.callControl.signalingState = SignalingStateAnswered;
    NSString* topText = [NSString stringWithFormat:@"Tổng đài nhận cuộc gọi: %@", [CallUtils formatPhone:self.call.toAlias]];
    [self.lblTop setText:topText];
    [self updateScreen];
    [self startTimer];
  });
}

// MARK: - StringeeCallDelegate

- (void)didChangeSignalingState:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason {
  NSLog(@"*********Callstate 1: %ld", (long)signalingState);
  // [StringeeImplement instance].signalingState = signalingState;
  SignalingState prevState = self.callControl.signalingState;
  self.callControl.signalingState = signalingState;
  dispatch_async(dispatch_get_main_queue(), ^{
    switch (signalingState) {
      case SignalingStateCalling: {
      } break;
      case SignalingStateRinging: {
        [self fetchFromPhone];
        [self.lblState setText:@"Đang đổ chuông..."];
      } break;
      case SignalingStateAnswered: {
        [self.lblState setText:@"Đang kết nối..."];
        self.callControl.signalingState = SignalingStateAnswered;
        [self updateScreen];
        [self startTimer];
        [self fetchFromPhone];
      } break;
      case SignalingStateBusy: {
        [self endCallAndDismissWithTitle:@"Số máy bận"];
      } break;
      case SignalingStateEnded: {
        CallManager* callManager = [CallManager sharedInstance];
        if (!callManager.rejected && self.callControl.isIncoming) {
          [self notifyMissCall:prevState fromNumber:self.callControl.from];
        }
        callManager.rejected = false;
        [self endCallAndDismissWithTitle:@"Cuộc gọi đã kết thúc"];
        
      } break;
    }
  });
}

- (void) notifyMissCall:(SignalingState) prevState fromNumber:(NSString*) phoneNumber  {
  if (prevState != SignalingStateAnswered) {
    NSLog(@"SignalingStateEnded MissCall from phone = %@", phoneNumber);
    UNMutableNotificationContent *objNotificationContent = [[UNMutableNotificationContent alloc] init];
    NSString* body = @"";
    body = [body stringByAppendingFormat:@"Bạn có cuộc gọi nhỡ từ số %@",[CallUtils formatPhone:phoneNumber]];
    objNotificationContent.title = [NSString localizedUserNotificationStringForKey:@"Cuộc gọi nhỡ" arguments:nil];
    objNotificationContent.body = body;
    objNotificationContent.sound = [UNNotificationSound defaultSound];

    // Deliver the notification in five seconds.
    UNTimeIntervalNotificationTrigger *trigger =  [UNTimeIntervalNotificationTrigger                                        triggerWithTimeInterval:1 repeats:NO];
    UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:@"missNotification" content:objNotificationContent trigger:trigger];
    // 3. schedule localNotification
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

    [center addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
        if (!error) {
            NSLog(@"Local Notification succeeded");
        } else {
            NSLog(@"Local Notification failed");
        }
    }];
  }
}

- (void)didChangeMediaState:(StringeeCall *)stringeeCall mediaState:(MediaState)mediaState {
  dispatch_async(dispatch_get_main_queue(), ^{
    switch (mediaState) {
      case MediaStateConnected:
        //                hasConnectedMedia = YES;
        //                if (hasAnsweredCall) {
        //                    [self startTimer];
        //                }
        //                [self beginStatsReports];
        
        break;
      case MediaStateDisconnected:
        break;
      default:
        break;
    }
  });
}

- (void)didHandleOnAnotherDevice:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason {
  NSLog(@"didHandleOnAnotherDevice %ld", (long)signalingState);
  if (signalingState == SignalingStateAnswered) {
    [self endCallAndDismissWithTitle:@"Cuộc gọi đã được nghe ở thiết bị khác"];
    return;
  }
  if (signalingState == SignalingStateBusy) {
    CallManager* callManager = [CallManager sharedInstance];
    callManager.rejected = true;
    return;
  }
}



@end

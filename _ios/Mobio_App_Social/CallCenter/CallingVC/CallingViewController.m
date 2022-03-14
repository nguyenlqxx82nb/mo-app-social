
#import "CallingViewController.h"
#import "StringeeImplement.h"
#import "InstanceManager.h"
#import "CallUtils.h"

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

- (UIStatusBarStyle)preferredStatusBarStyle
{
  if (@available(iOS 13.0, *)) {
    return UIStatusBarStyleDarkContent;
  } else {
    // Fallback on earlier versions
    return UIStatusBarStyleDefault;
  }
}

- (void) setupUI {
  NSLog(@"setupUI displayName= %@", [self.callControl displayName]);
  
  NSString* fontMedium = @"SFProText-Medium";
  NSString* fontRegular = @"SFProText-Regular";
//  NSString* fontBold = @"SFProText-Bold";
  
  UIColor* primaryColor = [UIColor colorWithRed:0.00 green:0.61 blue:0.86 alpha:1];
  UIColor* textColor = [UIColor colorWithRed:0.31 green:0.31 blue:0.31 alpha:1];
  UIColor* redColor = [UIColor colorWithRed:1 green:0.33 blue:0.33 alpha:1];
  
  // self.imageAvatar = [[UIImage alloc] initWithData:data];
  self.avatarImg.image = [UIImage imageNamed:@"avatar" ];
  self.avatarImg.layer.cornerRadius = self.avatarImg.frame.size.width / 2 ;
  self.avatarImg.clipsToBounds = YES;
  [self.avatarImg.layer setBorderColor: [primaryColor CGColor]];
  [self.avatarImg.layer setBorderWidth: 2.0];
  
  [self.lblTop setFont:[UIFont fontWithName:fontRegular size:14]];
  [self.lblTop setTextColor:textColor];
  
  [self.lblName setFont:[UIFont fontWithName:fontMedium size:18]];
  [self.lblName setTextColor:textColor];
  
  [self.lblState setFont:[UIFont fontWithName:fontRegular size:14]];
  [self.lblState setTextColor:textColor];
  
  [self.lblEnd setFont:[UIFont fontWithName:fontRegular size:14]];
  [self.lblEnd setTextColor:redColor];
  
  [self.lblPad setFont:[UIFont fontWithName:fontMedium size:14]];
  [self.lblPad setTextColor:textColor];
  
  [self.lblAssign setFont:[UIFont fontWithName:fontMedium size:14]];
  [self.lblAssign setTextColor:textColor];
  
  [self.lblSpeaker setFont:[UIFont fontWithName:fontMedium size:14]];
  [self.lblSpeaker setTextColor:textColor];
  
  [self.btnCall.titleLabel setFont:[UIFont fontWithName:fontMedium size:16]];
  [self.btnCallPhone.titleLabel setFont:[UIFont fontWithName:fontMedium size:16]];
  
  self.lblName.text = [CallUtils formatPhone:[self.callControl displayName]];
  self.lblState.text = self.callControl.isIncoming ? @"Đang gọi đến" : @"Đang gọi";
  [self updateScreen];
  [self updateSpeaker:isSpeaker];
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
  CGSize size = [[UIScreen mainScreen] bounds].size;
  padView = [[NumberPadView alloc] initWithFrame:CGRectMake(0,size.height,size.width,470)];
  padView.delegate = self;
  [self.contentView addSubview:padView];
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
    [[NSNotificationCenter defaultCenter] postNotificationName:@"stringeeEndCall" object:self userInfo:@{@"callId": self.callControl.callId, @"time": [NSString stringWithFormat:@"%i", time]}];
    self.lblEnd.text = title;
    self.lblState.alpha = 1;
    // [self.lblState setTextColor:redColor];
    [UIView animateWithDuration:0.5 delay:0.5 options:UIViewAnimationOptionRepeat | UIViewAnimationOptionAutoreverse animations:^{
      self.lblState.alpha = 0;
    } completion:nil];
    
    // self.view.userInteractionEnabled = NO;
    self.endView.hidden = NO;
    self.bottomView.hidden = YES;
    self.controlView.hidden = YES;
    
    [[UIDevice currentDevice] setProximityMonitoringEnabled:NO];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:AVAudioSessionRouteChangeNotification object:nil];
    [self endStatsReports];
    
    // End callkit
    [[CallManager sharedInstance] endCall];
    [[CallManager sharedInstance] clean];
    
    [self stopTimer];
    [self stopTimeoutTimer];
    
    [self delayCallback:^{
      if (![InstanceManager instance].callingViewController) {
        return;
      }
      UIViewController *vc = self.presentingViewController;
      while (vc.presentingViewController) {
        vc = vc.presentingViewController;
      }
      [vc dismissViewControllerAnimated:YES completion:^{
        [InstanceManager instance].callingViewController = nil;
        NSLog(@"dismissViewControllerAnimated");
      }];
      
    } forTotalSeconds:3];
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

// Hàm nhảy dây
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
        
        //                if ([StringeeImplement instance].stringeeClient.hasConnected) {
        //
        //                    if (audioBw >= 35000) {
        //
        //                        [self.imageInternetQuality setImage:[UIImage imageNamed:@"exellent"]];
        //
        //                    } else if (audioBw >= 25000 && audioBw < 35000) {
        //
        //                        [self.imageInternetQuality setImage:[UIImage imageNamed:@"good"]];
        //
        //                    } else if (audioBw > 15000 && audioBw < 25000) {
        //
        //                        [self.imageInternetQuality setImage:[UIImage imageNamed:@"average"]];
        //
        //                    } else {
        //                        [self.imageInternetQuality setImage:[UIImage imageNamed:@"poor"]];
        //                    }
        //                } else {
        //                    [self.imageInternetQuality setImage:[UIImage imageNamed:@"no_connect"]];
        //                }
        
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
        [self endCallAndDismissWithTitle:@"Cuộc gọi đã kết thúc"];
      } break;
        
    }
  });
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
  }
}



@end

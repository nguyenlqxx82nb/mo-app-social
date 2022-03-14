
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <Stringee/Stringee.h>
#import "CallControl.h"
#import "NumberPadView.h"

@interface CallingViewController : UIViewController<StringeeCallDelegate, NumberPadDelegate>
            
// Outlet
@property (weak, nonatomic) IBOutlet UIImageView *avatarImg;
@property (weak, nonatomic) IBOutlet UILabel *lblTop;
@property (weak, nonatomic) IBOutlet UILabel *lblName;
@property (weak, nonatomic) IBOutlet UILabel *lblState;
// @property (weak, nonatomic) IBOutlet UILabel *lblEnd;
@property (weak, nonatomic) IBOutlet UILabel *lblEnd;

// @property (weak, nonatomic) IBOutlet UIButton *btnHangup;
@property (weak, nonatomic) IBOutlet UIButton *btnReject;
@property (weak, nonatomic) IBOutlet UIButton *btnAnswer;
@property (weak, nonatomic) IBOutlet UIButton *btnHangup;

@property (weak, nonatomic) IBOutlet UIButton *btnPadNumber;
@property (weak, nonatomic) IBOutlet UIButton *btnSpeaker;
@property (weak, nonatomic) IBOutlet UIButton *btnAssign;
@property (weak, nonatomic) IBOutlet UIButton *btnSpeakerOn;
@property (weak, nonatomic) IBOutlet UIButton *btnCall;
@property (weak, nonatomic) IBOutlet UIButton *btnCallPhone;
@property (weak, nonatomic) IBOutlet UIView *endView;
@property (weak, nonatomic) IBOutlet UIView *bottomView;
@property (weak, nonatomic) IBOutlet UIView *controlView;
@property (weak, nonatomic) IBOutlet UIView *contentView;
@property (weak, nonatomic) IBOutlet UIView *safeAreaView;

@property (weak, nonatomic) IBOutlet UILabel *lblPad;
@property (weak, nonatomic) IBOutlet UILabel *lblAssign;
@property (weak, nonatomic) IBOutlet UILabel *lblSpeaker;

// Variable
@property(assign, nonatomic) int timeSec;
@property(assign, nonatomic) int timeMin;
@property(strong, nonatomic) AVAudioPlayer *ringAudioPlayer;


// New SDK
@property(strong, nonatomic) NSString *username;
@property(strong, nonatomic) NSString *from;
@property(strong, nonatomic) NSString *to;
@property(strong, nonatomic) StringeeCall *stringeeCall;
@property(assign, nonatomic) BOOL isIncomingCall;
@property(assign, nonatomic) BOOL isCalling;

@property(strong, nonatomic) StringeeCall *call;
@property(strong, nonatomic) CallControl *callControl;

// Outlet Action
- (IBAction)endCallTapped:(UIButton *)sender;
- (IBAction)muteTapped:(UIButton *)sender;
- (IBAction)speakerTapped:(UIButton *)sender;
- (IBAction)acceptTapped:(UIButton *)sender;
- (IBAction)declineTapped:(UIButton *)sender;
- (IBAction)numberPadTapped:(UIButton *)sender;
- (IBAction)callTapped:(UIButton *)sender;
- (IBAction)callPhoneTapped:(UIButton *)sender;


- (void)stopTimer;
- (void)startTimer;
- (void)stopTimeoutTimer;
// - (void)answerCallWithAnimation:(BOOL)isAnimation;
// - (void)decline;
- (void)updateSpeaker:(BOOL) isSpeaker;
- (void)endCallAndDismissWithTitle:(NSString *)title;
//- (void)init: (CallControl*) control call: (StringeeCall*) call;
- (void)updateScreen;
- (void)updateAnswerState;
- (instancetype)initWithParams:(NSString*)name andControl:(CallControl*)control andCall:(StringeeCall*)call;
- (void)fetchProfile:(NSString*) phone;
- (void)fetchFromPhone;
@end

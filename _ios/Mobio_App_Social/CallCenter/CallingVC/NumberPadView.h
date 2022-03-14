//
//  NumberPadView.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/22/21.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol NumberPadDelegate <NSObject>   //define delegate protocol
    - (void) closeNumberPadView;
@end //end protocol

@interface NumberPadView : UIView

@property (nonatomic, weak) id <NumberPadDelegate> delegate;

@property(strong, nonatomic) IBOutlet UIView* contentView;
@property(strong, nonatomic) IBOutlet UIButton* btn1;
@property(strong, nonatomic) IBOutlet UIButton* btn2;
@property(strong, nonatomic) IBOutlet UIButton* btn3;
@property(strong, nonatomic) IBOutlet UIButton* btn4;
@property(strong, nonatomic) IBOutlet UIButton* btn5;
@property(strong, nonatomic) IBOutlet UIButton* btn6;
@property(strong, nonatomic) IBOutlet UIButton* btn7;
@property(strong, nonatomic) IBOutlet UIButton* btn8;
@property(strong, nonatomic) IBOutlet UIButton* btn9;
@property(strong, nonatomic) IBOutlet UIButton* btn0;
@property(strong, nonatomic) IBOutlet UIButton* btn11;
@property(strong, nonatomic) IBOutlet UIButton* btn12;
@property(strong, nonatomic) IBOutlet UIButton* btnClose;
@property(strong, nonatomic) IBOutlet UILabel* lblResult;

- (IBAction)btn1Tapped:(UIButton *)sender;
- (IBAction)btn2Tapped:(UIButton *)sender;
- (IBAction)btn3Tapped:(UIButton *)sender;
- (IBAction)btn4Tapped:(UIButton *)sender;
- (IBAction)btn5Tapped:(UIButton *)sender;
- (IBAction)btn6Tapped:(UIButton *)sender;
- (IBAction)btn7Tapped:(UIButton *)sender;
- (IBAction)btn8Tapped:(UIButton *)sender;
- (IBAction)btn9Tapped:(UIButton *)sender;
- (IBAction)btn0Tapped:(UIButton *)sender;
- (IBAction)btn11Tapped:(UIButton *)sender;
- (IBAction)btn12Tapped:(UIButton *)sender;
- (IBAction)btnCloseTapped:(UIButton *)sender;


- (instancetype)initWithCoder:(NSCoder *)coder;
- (instancetype)initWithFrame:(CGRect)frame;

@end

NS_ASSUME_NONNULL_END

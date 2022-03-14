//
//  RoundButton.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/15/21.
//

#import <UIKit/UIKit.h>
@interface RoundedButton : UIButton

@property (nonatomic) IBInspectable UIColor *borderColor;
@property (nonatomic) IBInspectable CGFloat borderWidth;
@property (nonatomic) IBInspectable CGFloat cornerRadius;
@property (nonatomic) IBInspectable UIColor *normalBackgroundColor;
@property (nonatomic) IBInspectable UIColor *highlightedBackgroundColor;
@property (nonatomic) IBInspectable float highlightOpacity;
@property (assign, nonatomic) BOOL selected;

@end

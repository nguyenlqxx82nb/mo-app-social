//
//  AssignTableViewCell.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 4/17/21.
//

#import "AssignTableViewCell.h"

@implementation AssignTableViewCell

- (void)awakeFromNib {
  [super awakeFromNib];
  // Initialization code
  NSString* fontMedium = @"SFProText-Medium";
  NSString* fontRegular = @"SFProText-Regular";
//  NSString* fontBold = @"SFProText-Bold";
  
//  UIColor* primaryColor = [UIColor colorWithRed:0.00 green:0.61 blue:0.86 alpha:1];
  UIColor* textColor = [UIColor colorWithRed:0.31 green:0.31 blue:0.31 alpha:1];
//  UIColor* redColor = [UIColor colorWithRed:1 green:0.33 blue:0.33 alpha:1];
  
  [self.lblName setFont:[UIFont fontWithName:fontRegular size:16] ];
  [self.lblName setTextColor:textColor];
  
  [self.imgMark setHidden:YES];
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated {
  // [super setSelected:selected animated:animated];
  if (selected == YES) {
    [self.imgMark setHidden:NO];
  } else {
    [self.imgMark setHidden:YES];
  }
}



@end

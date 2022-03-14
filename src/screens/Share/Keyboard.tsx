import React, { PureComponent } from 'react';
import { Keyboard, Platform, View } from 'react-native';

interface SocialShareKeyboardScreenProps {

}

interface SocialShareKeyboardScreenState {
  keyBoardHeight: number;

}

export class SocialShareKeyboardScreen extends PureComponent<SocialShareKeyboardScreenProps, SocialShareKeyboardScreenState> {
  private subKeyboardWillShow: any;
	private subKeyboardWillHideListener: any;

  constructor(props: SocialShareKeyboardScreenProps) {
    super(props);
    this.state = {
      keyBoardHeight: 0
    };

  }

  componentDidMount() {
    this.subKeyboardWillShow = Keyboard.addListener('keyboardWillShow', this.handleKeyboardWillShow);
		this.subKeyboardWillHideListener = Keyboard.addListener('keyboardWillHide', this.handleKeyboardWillHide);
  }

  componentWillUnmount() {
    this.subKeyboardWillShow.remove();
		this.subKeyboardWillHideListener.remove();
  }

  private handleKeyboardWillShow = (e) => {
		this.setState({ keyBoardHeight: e.endCoordinates.height });

	}

	private handleKeyboardWillHide = () => {
		this.setState({ keyBoardHeight: 0 });
	}

  render() {
    const { keyBoardHeight } = this.state;
    return (
      !!keyBoardHeight && <View style={{ marginTop: keyBoardHeight }} />
    );
  }

}

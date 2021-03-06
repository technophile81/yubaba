import * as React from 'react';
import { unstable_renderSubtreeIntoContainer, unmountComponentAtNode } from 'react-dom';
import Collecter, {
  CollectorChildrenProps,
  AnimationCallback,
  CollectorData,
  CollectorActions,
} from '../Collector';
import SimpleKeyframe from '../SimpleKeyframe';

export interface SwipeProps extends CollectorChildrenProps {
  /**
   * Background, same usage as usual css.
   */
  background: string;

  /**
   * Direction the swipe will be heading towards.
   */
  direction: 'left' | 'right' | 'up' | 'down';

  /**
   * How long the animation should take over {duration}ms.
   */
  duration?: number;
}

/**
 * ## Swipe
 *
 * Swipe will animate a block swiping over the viewport.
 */
export default class Swipe extends React.Component<SwipeProps> {
  finishAnimation: () => Promise<any>;
  renderAnimation: (at?: number) => Promise<any>;
  finishAfterAnimate: () => Promise<any>;
  finishCleanup: () => void;

  static defaultProps = {
    duration: 500,
  };

  beforeAnimate: AnimationCallback = data => {
    return new Promise(resolve => {
      window.requestAnimationFrame(() => {
        const duration = this.props.duration as number;
        const elementToMountChildren = document.createElement('div');
        document.body.appendChild(elementToMountChildren);

        this.renderAnimation = (at?: number) => {
          const directionMap = {
            left: '100%, 0, 0',
            right: '-100%, 0, 0',
            down: '0, -100%, 0',
            up: '0, 100%, 0',
          };

          return new Promise(resolve => {
            unstable_renderSubtreeIntoContainer(
              data.caller,
              <SimpleKeyframe
                at={at}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: this.props.background,
                  transform: `translate3d(${directionMap[this.props.direction]})`,
                  transition: `transform ease-out ${duration}ms, opacity ease-in-out ${duration}ms`,
                }}
                keyframes={[
                  {
                    transform: 'translate3d(0, 0, 0)',
                  },
                  {
                    transform: 'translate3d(0, 0, 0)',
                    opacity: 0,
                  },
                ]}
                onFinish={resolve}
              />,
              elementToMountChildren
            );
          });
        };

        this.renderAnimation();

        resolve();

        this.finishCleanup = () => {
          unmountComponentAtNode(elementToMountChildren);
          document.body.removeChild(elementToMountChildren);
        };

        this.finishAfterAnimate = () => this.renderAnimation(1);
      });
    });
  };

  afterAnimate: AnimationCallback = () => {
    return this.finishAfterAnimate();
  };

  abort = () => this.finishCleanup();

  cleanup = () => {
    this.finishCleanup();
  };

  animate: AnimationCallback = () => {
    return this.renderAnimation(0);
  };

  render() {
    const data: CollectorData = {
      action: CollectorActions.animation,
      payload: {
        animate: this.animate,
        abort: this.abort,
        beforeAnimate: this.beforeAnimate,
        afterAnimate: this.afterAnimate,
        cleanup: this.cleanup,
      },
    };

    return <Collecter data={data}>{this.props.children}</Collecter>;
  }
}

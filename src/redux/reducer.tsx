import { LightswitchClient, Switch } from '../api-client';

type LightswitchState = {
  failed: boolean;
  loaded: boolean;
  switches: {
    [key: string]: Switch;
  }
}

const initialState = {
  failed: false,
  loaded: false,
  switches: {}
};

const LOADED_LIGHTSWITCH_CONTEXT = 'LOADED_LIGHTSWITCH_CONTEXT';
const FAILED_LOADING_LIGHTSWITCH_CONTEXT = 'FAILED_LOADING_LIGHTSWITCH_CONTEXT';

const reducer = (previousState: LightswitchState = initialState, action: any) => {
  switch (action && action.type) {
    case LOADED_LIGHTSWITCH_CONTEXT:
      return {
        failed: false,
        loaded: true,
        switches: action.switches.reduce((dict: any, aSwitch: Switch) => {
          dict[aSwitch.key] = aSwitch;
        }, {})
      }
    case FAILED_LOADING_LIGHTSWITCH_CONTEXT:
      return {
        failed: true,
        loaded: true,
        switches: {}
      };
  }

  return previousState;
};

const selectLightswitchState = (state: any): LightswitchState => state.lightswitch;
const selectHasFailed = (state: any) => selectLightswitchState(state).failed;
const makeSelectSwitch = (key: string) => (state: any) : Switch | null => {
  const lightswitchState = selectLightswitchState(state);
  if (!lightswitchState.failed && lightswitchState.loaded) {
    return lightswitchState.switches[key];
  }

  return null;
};

const thunk = (lightswitchClient: LightswitchClient, timeout = 3000) => {
  const disableSubscription = false;
  return (dispatch: any, getState: any) => {
    const initialSwitches = lightswitchClient.getSwitches();
    if (initialSwitches && initialSwitches.length > 0) {
      dispatch({
        switches: initialSwitches,
        type: LOADED_LIGHTSWITCH_CONTEXT
      });
    }
    else {
      setTimeout(() => {
        const currentState = getState && getState();
  
        if (currentState && !selectLightswitchState(currentState).loaded) {
          dispatch({
            type: FAILED_LOADING_LIGHTSWITCH_CONTEXT
          });
        }
      }, timeout);
    }

    lightswitchClient.subscribe(lightswitches => {
      if (!disableSubscription) {
        dispatch({
          switches: lightswitches,
          type: LOADED_LIGHTSWITCH_CONTEXT
        });
      }
    });
  }
}

export {
  makeSelectSwitch,
  reducer,
  selectHasFailed,
  thunk
};
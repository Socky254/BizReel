type Callback = (data?: any) => void;

class EventBus {
  private events: { [key: string]: Callback[] } = {};

  on(event: string, callback: Callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }
}

export const eventBus = new EventBus();

export const AppEvents = {
  UPLOAD_COMPLETED: 'upload_completed',
  FEED_REFRESH_REQUIRED: 'feed_refresh_required',
  PROFILE_UPDATED: 'profile_updated',
  AUTH_STATE_CHANGED: 'auth_state_changed',
};

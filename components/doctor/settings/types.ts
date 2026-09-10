export interface SettingsFormState {
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  avatar: string;
}

export const DEFAULT_SETTINGS_FORM: SettingsFormState = {
  name: '',
  specialty: '',
  clinic: '',
  phone: '',
  avatar: '',
};

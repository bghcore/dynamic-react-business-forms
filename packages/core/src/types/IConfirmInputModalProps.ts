/**
 * Interface to track the confirm input modal props
 */
export interface IConfirmInputModalProps {
  /**
   * The field that triggered the modal
   */
  confirmInputsTriggeredBy?: string;

  /**
   * The fields that need need to be updated within the Confirm Input Modal
   */
  dependentFieldNames?: string[];

  /**
   * Dirty fields that can be saved w/o confirmation
   */
  otherDirtyFields?: string[];
}

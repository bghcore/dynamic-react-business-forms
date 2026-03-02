export interface IFieldToRender {
  /**
   * Field Name
   */
  fieldName: string;

  /**
   * Soft Hidden means render the controller for hook forms but not the field input
   */
  softHidden?: boolean;
}

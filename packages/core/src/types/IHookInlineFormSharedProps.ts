import { IEntityData } from "../utils";

export interface IHookInlineFormSharedProps {
  entityId?: string;
  entityType?: string;
  programName: string;
  configName: string;
  parentEntityId?: string;
  parentEntityType?: string;
  entityPath?: string;
  areAllFieldsReadonly?: boolean;
  expandCutoffCount?: number;
  collapsedMaxHeight?: number;
  isCreate?: boolean;
  customSaveKey?: string;
  customSaveCallbackKey?: string;
  enableFilter?: boolean;
  /** Current user's UPN for value functions like setLoggedInUser */
  currentUserUpn?: string;
  /** Callback when save error occurs */
  onSaveError?: (error: string) => void;
  /** Parent entity data for value functions like inheritFromParent */
  parentEntity?: IEntityData;
}

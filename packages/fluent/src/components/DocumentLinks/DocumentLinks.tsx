import { DefaultButton, Dialog, DialogFooter, DialogType, PrimaryButton, TooltipHost } from "@fluentui/react";
import React from "react";
import { GetFieldDataTestId, DocumentLinksStrings } from "../../helpers";
import DocumentLink from "./DocumentLink";

export interface IDocumentLink {
  EntityTitle: string;
  DocumentLink: string;
}

interface IDocumentLinksProps {
  fieldName: string;
  programName?: string;
  entityType?: string;
  entityId?: string;
  className?: string;
  readOnly?: boolean;
  links: IDocumentLink[];
  onUpdateLinks?: (newLink: IDocumentLink, addNewLink?: boolean, index?: number) => void;
  onDeleteLink?: (index: number) => void;
}

const DocumentLinks = (props: IDocumentLinksProps) => {
  const { fieldName, programName, entityType, entityId, className, readOnly, links, onUpdateLinks, onDeleteLink } = props;
  const [addNewLink, setAddNewLink] = React.useState<boolean>(false);
  const [deleteLinkIndex, setDeleteLinkIndex] = React.useState<number | undefined>(undefined);

  const onAddNewLink = () => setAddNewLink(true);
  const onCancelAddLink = () => setAddNewLink(false);
  const onConfirmDeleteLink = (index: number) => setDeleteLinkIndex(index);
  const onCloseDeleteDialog = () => setDeleteLinkIndex(undefined);
  const commitDeleteLink = () => { onDeleteLink(deleteLinkIndex); setDeleteLinkIndex(undefined); };
  const saveLinks = (newLink: IDocumentLink, addNew?: boolean, index?: number) => { onUpdateLinks(newLink, addNew, index); setAddNewLink(false); };

  return (
    <div className={className}>
      {links?.length > 0 ? links.map((link, index) => (
        <DocumentLink
          key={`${link.DocumentLink}-${index}`} fieldName={fieldName} programName={programName}
          entityType={entityType} entityId={entityId} index={index} title={link.EntityTitle}
          url={link.DocumentLink} saveLinks={saveLinks} onConfirmDeleteLink={onConfirmDeleteLink} readOnly={readOnly}
        />
      )) : <></>}
      {addNewLink ? (
        <DocumentLink fieldName={fieldName} programName={programName} entityType={entityType} entityId={entityId}
          addNewLink saveLinks={saveLinks} onCancelAddLink={onCancelAddLink} />
      ) : !readOnly ? (
        <div className="add-link">
          <TooltipHost content={DocumentLinksStrings.addAnotherLink}>
            <DefaultButton
              text={links?.length > 0 ? DocumentLinksStrings.addAnotherLink : DocumentLinksStrings.addLink}
              iconProps={{ iconName: "Add" }} onClick={onAddNewLink}
              data-testid={`${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-add-link`}
            />
          </TooltipHost>
        </div>
      ) : <></>}
      <Dialog
        hidden={deleteLinkIndex === undefined}
        onDismiss={onCloseDeleteDialog}
        dialogContentProps={{ title: DocumentLinksStrings.deleteLink, type: DialogType.normal }}
        modalProps={{ isBlocking: true }}
      >
        <div>{`${DocumentLinksStrings.confirmDeleteLink} ${links?.[deleteLinkIndex]?.EntityTitle || ""}?`}</div>
        <DialogFooter>
          <PrimaryButton text={DocumentLinksStrings.delete} onClick={commitDeleteLink} />
          <DefaultButton text={DocumentLinksStrings.cancel} onClick={onCloseDeleteDialog} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default DocumentLinks;

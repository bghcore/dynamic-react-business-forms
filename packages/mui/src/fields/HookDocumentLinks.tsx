import { IFieldProps, FormStrings, FormConstants } from "@bghcore/dynamic-forms-core";
import {
  Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Tooltip, Typography,
} from "@mui/material";
import React from "react";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { FieldClassName, GetFieldDataTestId, DocumentLinksStrings } from "../helpers";

export interface IDocumentLink {
  title: string;
  url: string;
}

interface IDocumentLinkItemProps {
  fieldName: string;
  programName?: string;
  entityType?: string;
  entityId?: string;
  readOnly?: boolean;
  index?: number;
  title?: string;
  url?: string;
  addNewLink?: boolean;
  saveLinks: (newLink: IDocumentLink, addNewLink?: boolean, index?: number) => void;
  onCancelAddLink?: () => void;
  onConfirmDeleteLink?: (index: number) => void;
}

const DocumentLinkItem = (props: IDocumentLinkItemProps) => {
  const {
    fieldName, programName, entityType, entityId, readOnly, index, title, url, addNewLink,
    saveLinks, onCancelAddLink, onConfirmDeleteLink
  } = props;
  const { confirm, cancel, linkTitleLabel, linkUrlLabel, add, edit, deleteLabel } = FormStrings;

  const [editingLink, setEditingLink] = React.useState<boolean>(false);

  const { control, handleSubmit, setValue, reset, trigger } = useForm({
    mode: "onChange",
    defaultValues: { title: addNewLink ? "" : title, url: addNewLink ? "" : url }
  });

  const onSubmit = (data: { title: string; url: string }) => {
    saveLinks({ title: data.title, url: data.url }, addNewLink, index);
    setEditingLink(false);
  };

  React.useEffect(() => {
    setEditingLink(addNewLink);
  }, [title, url, addNewLink]);

  const onLinkTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setValue("title", e.target.value); trigger("title"); };
  const onLinkUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => { setValue("url", e.target.value); trigger("url"); };
  const onEditDocumentLink = () => setEditingLink(true);
  const onCancelFormChanges = () => { reset(); setEditingLink(false); onCancelAddLink?.(); };
  const onDelete = () => onConfirmDeleteLink(index);

  return editingLink ? (
    <div className="editing-link">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <Typography variant="subtitle2">
            {addNewLink ? add : edit} {DocumentLinksStrings.link}
          </Typography>
          <div style={{ display: "flex", gap: "4px" }}>
            <IconButton size="small" aria-label={confirm} onClick={handleSubmit(onSubmit)}>&#10003;</IconButton>
            <IconButton size="small" aria-label={cancel} onClick={onCancelFormChanges}>&#10005;</IconButton>
          </div>
        </div>
        <Controller name="title" control={control} rules={{ required: { value: true, message: FormStrings.required } }}
          render={({ field, fieldState: { error } }) => (
            <div style={{ marginBottom: "8px" }}>
              <TextField
                label={linkTitleLabel}
                value={field.value}
                onChange={onLinkTitleChange}
                required
                size="small"
                fullWidth
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  "data-testid": `${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-link-title`,
                }}
              />
            </div>
          )} />
        <Controller name="url" control={control}
          rules={{
            required: { value: true, message: FormStrings.required },
            pattern: { value: FormConstants.urlRegex, message: FormStrings.urlRequired }
          }}
          render={({ field, fieldState: { error } }) => (
            <div style={{ marginBottom: "8px" }}>
              <TextField
                label={linkUrlLabel}
                value={field.value}
                onChange={onLinkUrlChange}
                required
                size="small"
                fullWidth
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  "data-testid": `${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-link-url`,
                }}
              />
            </div>
          )} />
      </form>
    </div>
  ) : addNewLink ? null : (
    <ListItem
      className="document-link-item"
      disableGutters
      secondaryAction={
        !readOnly ? (
          <div style={{ display: "flex", gap: "2px" }}>
            <Tooltip title={edit}><IconButton size="small" aria-label={edit} onClick={onEditDocumentLink}>&#9998;</IconButton></Tooltip>
            <Tooltip title={deleteLabel}><IconButton size="small" aria-label={deleteLabel} onClick={onDelete}>&#128465;</IconButton></Tooltip>
          </div>
        ) : undefined
      }
    >
      <ListItemText
        primary={
          <a className="link" href={url} target="_blank" rel="noopener noreferrer">{title}</a>
        }
      />
    </ListItem>
  );
};

const HookDocumentLinks = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, setFieldValue } = props;

  const { watch } = useFormContext();
  const documentLinks = watch(`${fieldName}` as const);

  const [addNewLink, setAddNewLink] = React.useState<boolean>(false);
  const [deleteLinkIndex, setDeleteLinkIndex] = React.useState<number | undefined>(undefined);

  const onUpdateLinks = (newLink: IDocumentLink, addNew?: boolean, index?: number) => {
    let newDocumentLinks: IDocumentLink[] = [];
    if (addNew && !documentLinks) {
      newDocumentLinks = [newLink];
    } else if (addNew) {
      newDocumentLinks = [...documentLinks, newLink];
    } else {
      newDocumentLinks = [...documentLinks];
      newDocumentLinks[index] = newLink;
    }
    setFieldValue(fieldName, newDocumentLinks);
  };

  const onDeleteLink = (index: number) => {
    const newDocumentLinks = [...documentLinks];
    newDocumentLinks.splice(index, 1);
    setFieldValue(fieldName, newDocumentLinks);
  };

  const onAddNewLink = () => setAddNewLink(true);
  const onCancelAddLink = () => setAddNewLink(false);
  const onConfirmDeleteLink = (index: number) => setDeleteLinkIndex(index);
  const onCloseDeleteDialog = () => setDeleteLinkIndex(undefined);
  const commitDeleteLink = () => { onDeleteLink(deleteLinkIndex); setDeleteLinkIndex(undefined); };
  const saveLinks = (newLink: IDocumentLink, addNew?: boolean, index?: number) => { onUpdateLinks(newLink, addNew, index); setAddNewLink(false); };

  const links = value as IDocumentLink[];

  return (
    <div className={FieldClassName("hook-document-links", readOnly ? undefined : error)}>
      <List disablePadding>
        {links?.length > 0 ? links.map((link, index) => (
          <DocumentLinkItem
            key={`${link.url}-${index}`} fieldName={fieldName} programName={programName}
            entityType={entityType} entityId={entityId} index={index} title={link.title}
            url={link.url} saveLinks={saveLinks} onConfirmDeleteLink={onConfirmDeleteLink} readOnly={readOnly}
          />
        )) : null}
      </List>
      {addNewLink ? (
        <DocumentLinkItem fieldName={fieldName} programName={programName} entityType={entityType} entityId={entityId}
          addNewLink saveLinks={saveLinks} onCancelAddLink={onCancelAddLink} />
      ) : !readOnly ? (
        <div className="add-link" style={{ marginTop: "8px" }}>
          <Tooltip title={DocumentLinksStrings.addAnotherLink}>
            <Button
              variant="outlined"
              size="small"
              onClick={onAddNewLink}
              data-testid={`${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-add-link`}
            >
              {links?.length > 0 ? DocumentLinksStrings.addAnotherLink : DocumentLinksStrings.addLink}
            </Button>
          </Tooltip>
        </div>
      ) : null}

      <Dialog open={deleteLinkIndex !== undefined} onClose={onCloseDeleteDialog}>
        <DialogTitle>{DocumentLinksStrings.deleteLink}</DialogTitle>
        <DialogContent>
          {`${DocumentLinksStrings.confirmDeleteLink} ${links?.[deleteLinkIndex]?.title || ""}?`}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onCloseDeleteDialog}>{DocumentLinksStrings.cancel}</Button>
          <Button variant="contained" onClick={commitDeleteLink}>{DocumentLinksStrings.delete}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HookDocumentLinks;

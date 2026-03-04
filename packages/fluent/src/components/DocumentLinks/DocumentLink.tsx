import { FormStrings, FormConstants } from "@bghcore/dynamic-forms-core";
import { Input, Button, Tooltip } from "@fluentui/react-components";
import { CheckmarkRegular, DismissRegular, EditRegular, DeleteRegular } from "@fluentui/react-icons";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { GetFieldDataTestId, DocumentLinksStrings } from "../../helpers";
import { IDocumentLink } from "./DocumentLinks";

interface IDocumentLinkProps {
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

interface IHookDocumentLink {
  title: string;
  url: string;
}

const DocumentLink = (props: IDocumentLinkProps) => {
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

  const onSubmit = (data: IHookDocumentLink) => {
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
        <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="header-label">
            {addNewLink ? add : edit} {DocumentLinksStrings.link}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <Button appearance="subtle" icon={<CheckmarkRegular />} aria-label={confirm} onClick={handleSubmit(onSubmit)} />
            <Button appearance="subtle" icon={<DismissRegular />} aria-label={cancel} onClick={onCancelFormChanges} />
          </div>
        </div>
        <Controller name="title" control={control} rules={{ required: { value: true, message: FormStrings.required } }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <label>{linkTitleLabel}</label>
              <Input value={field.value} onChange={onLinkTitleChange} required
                data-testid={`${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-link-title`} />
              {error && <span className="error-message">{error.message}</span>}
            </div>
          )} />
        <Controller name="url" control={control}
          rules={{
            required: { value: true, message: FormStrings.required },
            pattern: { value: FormConstants.urlRegex, message: FormStrings.urlRequired }
          }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <label>{linkUrlLabel}</label>
              <Input value={field.value} onChange={onLinkUrlChange} required
                data-testid={`${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-link-url`} />
              {error && <span className="error-message">{error.message}</span>}
            </div>
          )} />
      </form>
    </div>
  ) : addNewLink ? null : (
    <div className="document-link-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <a className="link" href={url} target="_blank" rel="noopener noreferrer">{title}</a>
      {!readOnly && (
        <div style={{ display: "flex", gap: "2px" }}>
          <Tooltip content={edit} relationship="label"><Button appearance="subtle" icon={<EditRegular />} aria-label={edit} onClick={onEditDocumentLink} /></Tooltip>
          <Tooltip content={deleteLabel} relationship="label"><Button appearance="subtle" icon={<DeleteRegular />} aria-label={deleteLabel} onClick={onDelete} /></Tooltip>
        </div>
      )}
    </div>
  );
};

export default DocumentLink;

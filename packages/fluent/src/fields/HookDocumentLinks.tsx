import { IFieldProps } from "@bghcore/dynamic-forms-core";
import React from "react";
import { useFormContext } from "react-hook-form";
import DocumentLinks, { IDocumentLink } from "../components/DocumentLinks/DocumentLinks";
import { FieldClassName } from "../helpers";

const HookDocumentLinks = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, setFieldValue } = props;

  const { watch } = useFormContext();
  const documentLinks = watch(`${fieldName}` as const);

  const onUpdateLinks = (newLink: IDocumentLink, addNewLink?: boolean, index?: number) => {
    let newDocumentLinks: IDocumentLink[] = [];
    if (addNewLink && !documentLinks) {
      newDocumentLinks = [newLink];
    } else if (addNewLink) {
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

  return readOnly ? (
    <DocumentLinks
      fieldName={fieldName}
      programName={programName}
      entityType={entityType}
      entityId={entityId}
      className="hook-document-links"
      links={value as IDocumentLink[]}
      readOnly
    />
  ) : (
    <DocumentLinks
      fieldName={fieldName}
      programName={programName}
      entityType={entityType}
      entityId={entityId}
      className={FieldClassName("hook-document-links", error)}
      links={value as IDocumentLink[]}
      onUpdateLinks={onUpdateLinks}
      onDeleteLink={onDeleteLink}
    />
  );
};

export default HookDocumentLinks;

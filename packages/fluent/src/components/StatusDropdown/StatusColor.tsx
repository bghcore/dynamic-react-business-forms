import { Dictionary } from "@brhanso/dynamic-forms-core";
import React from "react";

interface IStatusColorProps {
  statusColors: Dictionary<string>;
  status: string;
}

const StatusColor = (props: IStatusColorProps) => {
  const { statusColors, status } = props;
  return (
    <div
      className="status-color"
      style={{ backgroundColor: statusColors && status && statusColors[status] }}
    />
  );
};

export default StatusColor;

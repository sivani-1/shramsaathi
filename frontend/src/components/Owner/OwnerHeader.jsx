import React from "react";

const OwnerHeader = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col mb-6 border-b pb-4">
      <h1 className="text-3xl font-bold text-gray-800">
        👔 {title || "Owner Dashboard"}
      </h1>
      {subtitle && (
        <p className="text-gray-500 text-sm mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default OwnerHeader;

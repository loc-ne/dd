import React from 'react';

const Label = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

export default Label;

import React from 'react';

export function Table({ children, ...props }) {
  return <table className="min-w-full divide-y divide-gray-200" {...props}>{children}</table>;
}

export function TableBody({ children, ...props }) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableCell({ children, ...props }) {
  return <td className="px-4 py-2 whitespace-nowrap" {...props}>{children}</td>;
}

export function TableHead({ children, ...props }) {
  return <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>{children}</th>;
}

export function TableHeader({ children, ...props }) {
  return <thead className="bg-gray-50" {...props}>{children}</thead>;
}

export function TableRow({ children, ...props }) {
  return <tr className="hover:bg-gray-100" {...props}>{children}</tr>;
} 
import clsx from 'classnames';
import React from 'react';

export default function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className, children, ...btnProps } = props;

  return (
    <button
      className={clsx(
        'bg-white border border-gray-300 hover:bg-blue-500 hover:drop-shadow hover:text-white flex flex-row items-center justify-center text-protoconn-green-vogue font-semibold uppercase font-poppins py-2 px-12 rounded focus:outline-none focus:shadow-outline transition-[background-color]',
        className
      )}
      {...btnProps}
    >
      {children}
    </button>
  );
}

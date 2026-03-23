import * as React from 'react';
import { Modal as PolarisModal } from '@shopify/polaris';

type PolarisModalProps = React.ComponentProps<typeof PolarisModal>;

interface ModalProps extends Omit<PolarisModalProps, 'open' | 'onClose'> {
  open?: boolean;
  defaultOpen?: boolean;
  onChange?: (next: boolean) => void;
  fullScreen?: boolean;
}

export function Modal({ open, defaultOpen = false, onChange, ...rest }: ModalProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const actualOpen = isControlled ? open! : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onChange?.(next);
  };

  return <PolarisModal open={actualOpen} onClose={() => setOpen(false)} {...rest} />;
}

Modal.Section = PolarisModal.Section;

export default Modal;

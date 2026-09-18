import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import "../styles/common/SimpleModal.css";

type ModalTone = "default" | "danger";

type AlertOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  tone?: ModalTone;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ModalTone;
};

type ModalState = {
  open: boolean;
  mode: "alert" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: ModalTone;
};

type SimpleModalContextValue = {
  openAlert: (options: string | AlertOptions) => void;
  openConfirm: (options: string | ConfirmOptions) => Promise<boolean>;
};

const SimpleModalContext =
  createContext<SimpleModalContextValue | null>(null);

const initialState: ModalState = {
  open: false,
  mode: "alert",
  title: "안내",
  message: "",
  confirmText: "확인",
  cancelText: "취소",
  tone: "default",
};

export const SimpleModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [modal, setModal] = useState<ModalState>(initialState);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeModal = useCallback((result: boolean) => {
    setModal((prev) => ({
      ...prev,
      open: false,
    }));

    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const openAlert = useCallback((options: string | AlertOptions) => {
    const config =
      typeof options === "string"
        ? { message: options }
        : options;

    setModal({
      open: true,
      mode: "alert",
      title: config.title ?? "안내",
      message: config.message,
      confirmText: config.confirmText ?? "확인",
      cancelText: "취소",
      tone: config.tone ?? "default",
    });
  }, []);

  const openConfirm = useCallback(
    (options: string | ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const config =
          typeof options === "string"
            ? { message: options }
            : options;

        resolverRef.current = resolve;

        setModal({
          open: true,
          mode: "confirm",
          title: config.title ?? "확인",
          message: config.message,
          confirmText: config.confirmText ?? "확인",
          cancelText: config.cancelText ?? "취소",
          tone: config.tone ?? "default",
        });
      }),
    [],
  );

  const value = useMemo(
    () => ({
      openAlert,
      openConfirm,
    }),
    [openAlert, openConfirm],
  );

  return (
    <SimpleModalContext.Provider value={value}>
      {children}

      {modal.open && (
        <div
          className="simple-modal-overlay"
          onMouseDown={(event) => {
            if (
              modal.mode === "confirm" &&
              event.target === event.currentTarget
            ) {
              closeModal(false);
            }
          }}
        >
          <section
            className={`simple-modal simple-modal-${modal.tone}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="simple-modal-title"
          >
            <p className="simple-modal-eyebrow">
              GODDESS MESSAGE
            </p>

            <h2 id="simple-modal-title">
              {modal.title}
            </h2>

            <p className="simple-modal-message">
              {modal.message}
            </p>

            <div className="simple-modal-actions">
              {modal.mode === "confirm" && (
                <button
                  type="button"
                  className="simple-modal-cancel"
                  onClick={() => closeModal(false)}
                >
                  {modal.cancelText}
                </button>
              )}

              <button
                type="button"
                className="simple-modal-confirm"
                onClick={() => closeModal(true)}
                autoFocus
              >
                {modal.confirmText}
              </button>
            </div>
          </section>
        </div>
      )}
    </SimpleModalContext.Provider>
  );
};

export const useSimpleModal = () => {
  const context = useContext(SimpleModalContext);

  if (!context) {
    throw new Error(
      "useSimpleModal은 SimpleModalProvider 안에서 사용해야 합니다.",
    );
  }

  return context;
};

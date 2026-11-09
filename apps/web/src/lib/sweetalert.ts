import Swal, { SweetAlertOptions } from 'sweetalert2';

const customSwal = Swal.mixin({
  customClass: {
    popup: 'swal2-modal-modern font-sans shadow-2xl rounded-3xl border border-slate-200/90 p-6 sm:p-8 bg-white',
    title: 'text-slate-900 font-bold text-base sm:text-lg shrink-0',
    htmlContainer: 'text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed',
    confirmButton: 'px-6 py-2.5 bg-theme-primary hover:bg-theme-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-theme-primary/40',
    cancelButton: 'px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none',
    denyButton: 'px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500/40',
    actions: 'flex items-center justify-center gap-2 mt-5',
  },
  buttonsStyling: false,
  allowOutsideClick: true,
  allowEscapeKey: true,
});

export const showAlert = {
  success: (title: string, text?: string) => {
    return customSwal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'ตกลง',
      timer: 2500,
      timerProgressBar: true,
    });
  },

  error: (title: string, text?: string) => {
    return customSwal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'ตกลง',
    });
  },

  warning: (title: string, text?: string) => {
    return customSwal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'ตกลง',
    });
  },

  info: (title: string, text?: string) => {
    return customSwal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'ตกลง',
    });
  },

  confirm: async (title: string, text?: string, confirmText: string = 'ยืนยัน', cancelText: string = 'ยกเลิก', isDestructive: boolean = false) => {
    const result = await customSwal.fire({
      icon: isDestructive ? 'warning' : 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: 'swal2-modal-modern font-sans shadow-2xl rounded-3xl border border-slate-200/90 p-6 sm:p-8 bg-white',
        title: 'text-slate-900 font-bold text-base sm:text-lg shrink-0',
        htmlContainer: 'text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed',
        confirmButton: isDestructive
          ? 'px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500/40'
          : 'px-6 py-2.5 bg-theme-primary hover:bg-theme-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-theme-primary/40',
        cancelButton: 'px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all mx-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none',
        actions: 'flex items-center justify-center gap-2 mt-5',
      },
    });
    return result.isConfirmed;
  },

  toast: (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info', text?: string) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    return Swal.fire({
      toast: true,
      position: isMobile ? 'top' : 'top-end',
      backdrop: false,
      showConfirmButton: false,
      timer: isMobile ? 3000 : 3500,
      timerProgressBar: true,
      icon,
      title,
      text,
      customClass: {
        container: 'z-[999999] pointer-events-none',
        popup: 'rounded-2xl shadow-xl border border-slate-200/90 p-3 sm:p-4 font-sans bg-white text-slate-800 pointer-events-auto',
        title: 'text-xs sm:text-sm font-semibold text-slate-800',
      },
    });
  },

  fire: (options: SweetAlertOptions) => customSwal.fire(options),
};

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success', text?: string) =>
  showAlert.toast(title, icon, text);

export const showSuccessAlert = (title: string, text?: string) =>
  showAlert.success(title, text);

export const showErrorAlert = (title: string, text?: string) =>
  showAlert.error(title, text);

export const showWarningAlert = (title: string, text?: string) =>
  showAlert.warning(title, text);

export const showInfoAlert = (title: string, text?: string) =>
  showAlert.info(title, text);

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDestructive?: boolean;
}

export const showConfirmDialog = async (
  optionsOrTitle: string | ConfirmOptions,
  textArg?: string,
  confirmTextArg: string = 'ยืนยัน',
  cancelTextArg: string = 'ยกเลิก'
): Promise<boolean> => {
  if (typeof optionsOrTitle === 'object') {
    return showAlert.confirm(
      optionsOrTitle.title,
      optionsOrTitle.text,
      optionsOrTitle.confirmButtonText || 'ยืนยัน',
      optionsOrTitle.cancelButtonText || 'ยกเลิก',
      optionsOrTitle.isDestructive || false
    );
  }
  return showAlert.confirm(optionsOrTitle, textArg, confirmTextArg, cancelTextArg);
};

export default customSwal;

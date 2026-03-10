import { HttpInterceptorFn } from '@angular/common/http';

/** Attach credentials (httpOnly cookie) to every API request */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

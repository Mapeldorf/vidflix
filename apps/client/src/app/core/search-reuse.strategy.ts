import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable()
export class SearchReuseStrategy implements RouteReuseStrategy {
  private cache: DetachedRouteHandle | null = null;

  private isBuscar(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path === 'buscar';
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.isBuscar(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (this.isBuscar(route)) {
      this.cache = handle;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.isBuscar(route) && this.cache !== null;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (this.isBuscar(route)) {
      return this.cache;
    }
    return null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}

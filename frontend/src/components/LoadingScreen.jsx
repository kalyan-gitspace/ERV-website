import React, { useEffect, useRef, useState } from 'react';
import Logo from './Logo';

export const INITIAL_LOAD_DURATION = 1500;
export const ROUTE_LOAD_DURATION = 500;
export const ADMIN_ROUTE_LOAD_DURATION = 800;

let activeRouteLoad = null;
const routeLoadSubscribers = new Set();

const notifyRouteLoadSubscribers = () => {
  const snapshot = activeRouteLoad
    ? { controller: activeRouteLoad, ready: activeRouteLoad.ready }
    : null;
  routeLoadSubscribers.forEach((subscriber) => subscriber(snapshot));
};

export const beginRouteLoad = () => {
  if (activeRouteLoad) {
    activeRouteLoad.resolveCompletion();
  }

  let resolveCompletion;
  const controller = {
    ready: false,
    completed: false,
    completion: new Promise((resolve) => { resolveCompletion = resolve; }),
    resolveCompletion,
  };
  activeRouteLoad = controller;
  notifyRouteLoadSubscribers();
  return controller;
};

export const markRouteReady = (controller) => {
  if (activeRouteLoad !== controller) return;
  controller.ready = true;
  notifyRouteLoadSubscribers();
};

export const finishRouteLoad = (controller) => {
  if (activeRouteLoad !== controller || controller.completed) return;
  controller.completed = true;
  activeRouteLoad = null;
  controller.resolveCompletion();
  notifyRouteLoadSubscribers();
};

export const subscribeToRouteLoad = (subscriber) => {
  routeLoadSubscribers.add(subscriber);
  subscriber(activeRouteLoad
    ? { controller: activeRouteLoad, ready: activeRouteLoad.ready }
    : null);
  return () => routeLoadSubscribers.delete(subscriber);
};

export function LoadingScreen({ mode = 'route', onComplete }) {
  const [progress, setProgress] = useState(0);
  const [routeLoad, setRouteLoad] = useState(
    activeRouteLoad
      ? { controller: activeRouteLoad, ready: activeRouteLoad.ready }
      : null
  );
  const [routeOffset, setRouteOffset] = useState(-100);
  const startedAtRef = useRef(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  if (startedAtRef.current === null) {
    startedAtRef.current = performance.now();
  }

  useEffect(() => {
    if (mode === 'route') {
      return subscribeToRouteLoad(setRouteLoad);
    }
  }, [mode]);

  useEffect(() => {
    const startedAt = performance.now();
    let finished = false;
    const tick = () => {
      if (finished) return;
      const now = performance.now();
      if (mode === 'initial' || mode === 'admin-initial') {
        const nextProgress = Math.min((now - startedAt) / INITIAL_LOAD_DURATION, 1);
        setProgress(nextProgress);
        if (nextProgress >= 1) {
          finished = true;
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current?.();
          }
        }
      } else if (mode === 'admin-route') {
        const nextProgress = Math.min((now - startedAt) / ADMIN_ROUTE_LOAD_DURATION, 1);
        setProgress(nextProgress);
        if (nextProgress >= 1) {
          finished = true;
          onCompleteRef.current?.();
        }
      } else if (routeLoad?.ready) {
        const nextProgress = Math.min((now - startedAt) / ROUTE_LOAD_DURATION, 1);
        setProgress(nextProgress);
        if (nextProgress >= 1) {
          finished = true;
          finishRouteLoad(routeLoad.controller);
        }
      } else {
        setRouteOffset((currentOffset) => (currentOffset >= 300 ? -100 : currentOffset + 2.5));
      }
    };
    const timer = window.setInterval(tick, 16);
    tick();
    return () => window.clearInterval(timer);
  }, [mode, routeLoad?.controller, routeLoad?.ready]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#030712]">
      <div className="absolute h-40 w-40 animate-pulse bg-[#38BDF8]/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5">
        <Logo variant="loader" size="loader" alt="Edge Route Vision Pvt. Ltd." />
        <div className="h-px w-32 overflow-hidden bg-white/10">
          {mode === 'route' && !routeLoad?.ready ? (
            <div className="h-full w-2/5 bg-[#38BDF8]" style={{ transform: `translateX(${routeOffset}%)` }} />
          ) : (
            <div
              className="h-full origin-left bg-[#38BDF8]"
              style={{ transform: `scaleX(${progress})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

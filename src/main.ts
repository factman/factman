import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Yield to the browser once before bootstrapping (ETE-126): evaluating the modules and hydrating
// the prerendered page then run as two tasks instead of one long one that blocks input. Clicks in
// between are not lost: event replay (app.config) plays them back once the page has hydrated.
setTimeout(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)));

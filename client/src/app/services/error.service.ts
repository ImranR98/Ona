import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor() { }

  stringifyError(err: any) {
    console.log(JSON.stringify(err))
    if (typeof err == 'string') return err
    if (err.error) if (typeof err.error == 'string') if (err.error.trim().length > 0) return err.error
    if (err.statusText) if (typeof err.statusText == 'string') if (err.statusText.trim().length > 0) return err.statusText
    if (err.message) if (typeof err.message == 'string') if (err.message.trim().length > 0) return err.message
    if (typeof err == 'object') return JSON.stringify(err)
    return 'Error'
  }
}

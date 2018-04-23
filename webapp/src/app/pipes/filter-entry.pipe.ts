import {Pipe, PipeTransform} from '@angular/core';
import {FilterFormEntry} from '../common/filter-form-entry';

@Pipe({name: 'formEntryFilter'})
export class FilterFormEntryPipe implements PipeTransform {
  transform(filterEntries: FilterFormEntry[], filter: string): FilterFormEntry[] {
    if (!filterEntries || !filter) {
      return filterEntries;
    }

    const lowerCaseFilter: string = filter.toLocaleLowerCase();
    return filterEntries.filter(entry => {
      return entry.key.toLocaleLowerCase().includes(lowerCaseFilter)
        || entry.display.toLocaleLowerCase().includes(lowerCaseFilter);
    });
  }
}

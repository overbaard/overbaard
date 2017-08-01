import * as Immutable from 'immutable';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AssigneesService} from '../../common/assignee/assignee.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {Assignee, AssigneeFactory, AssigneeUpdater} from '../../common/assignee/assignee.model';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-test-store',
  templateUrl: './test-store.component.html',
  styleUrls: ['./test-store.component.scss']
})
export class TestStoreComponent implements OnInit, OnDestroy {

  private id = 0;

  private assignees: Observable<Assignee[]>;
  private assigneeSubscriptions: Map<string, Subscription> = new Map<string, Subscription>();
  constructor(private assigneesService: AssigneesService) {
    this.assignees = assigneesService.getAssignees()
      .map((value) => {
        return value.toArray();
      });

    assigneesService.getAssignees().subscribe(assignees => {
        // Register an Observer for each new assignee, making sure to unsubscribe from the deleted ones
        this.assigneeSubscriptions.forEach((subscription, key)  => {
            if (!assignees.get(key)) {
              subscription.unsubscribe();
              this.assigneeSubscriptions.delete(key);
            }
        });

        assignees.forEach((assignee) => {
          if (!this.assigneeSubscriptions.get(assignee.key)) {
            this.assigneeSubscriptions.set(
              assignee.key,
              assigneesService.getAssignee(assignee.key).subscribe(currAssignee => {
                console.log('Updated assignee ' + currAssignee.key + ' ' + currAssignee.name);
              }));
          }});
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.assigneeSubscriptions.forEach((subscription)  => {
      subscription.unsubscribe();
    });
  }

  saveAssignee(form: any) {
    this.assigneesService.addAssignees([AssigneeFactory.fromJS({
      key: 'k' + ++this.id,
      name: form['name'],
      email: 'x@example.com',
      avatar: 'blah'
    })]);
  }

  reverseName(event: MouseEvent, assignee: Assignee): boolean {
    assignee = AssigneeUpdater.update(assignee, (updated => {
      updated.name = updated.name.split('').reverse().join('');
    }));
    this.assigneesService.tmpUpdateAssignee(assignee);
    return false;
  }
}

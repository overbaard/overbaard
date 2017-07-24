import * as Immutable from 'immutable';
import {Component, OnInit} from '@angular/core';
import {AssigneesService} from '../../common/assignee/assignee.service';
import {Observable} from 'rxjs/Observable';
import {Assignee, AssigneeFactory} from '../../common/assignee/assignee.model';

@Component({
  selector: 'app-test-store',
  templateUrl: './test-store.component.html',
  styleUrls: ['./test-store.component.scss']
})
export class TestStoreComponent implements OnInit {

  private id = 0;

  private assignees: Observable<Assignee[]>;

  constructor(private assigneesService: AssigneesService) {
    this.assignees = assigneesService.getAssignees();
    this.assignees.subscribe(
      data => { console.log('current data' + data); }
    );
  }

  ngOnInit() {
  }

  saveAssignee(form: any) {
    this.assigneesService.addAssignee(AssigneeFactory.fromJS({
      key: 'k' + ++this.id,
      name: form['name'],
      email: 'x@example.com',
      avatar: 'blah'
    }));
  }
}

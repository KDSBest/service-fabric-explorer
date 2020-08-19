import { Component, OnInit } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  SFXClusterName = '';

  tabs: ITab[] = [{
    name: 'essentials',
    route: ''
    },
    {
      name: 'details',
      route: '/details'
    },
    {
      name: 'metrics',
      route: '/metrics'
    },
    {
      name: 'cluster map',
      route: '/clustermap'
    },
    {
      name: 'image store',
      route: '/imagestore'
    },
    {
      name: 'manifest',
      route: '/manifest'
    },
    {
      name: 'events',
      route: '/events'
    }
  ];
  constructor(public tree: TreeService, public dataService: DataService) { }

  ngOnInit() {
    this.tree.selectTreeNode([
      IdGenerator.cluster()
    ], true);

    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.dataService.clusterManifest.isBackupRestoreEnabled) {
        this.tabs = this.tabs.concat({
          name: 'backups',
          route: '/backups'
        });
      }
      if (this.dataService.clusterManifest.isRepairManagerEnabled) {
        this.tabs = this.tabs.concat({
          name: 'repair jobs',
          route: '/repairtasks'
        });
      }
    });

    this.dataService.nodes.refresh().subscribe( () => {
      this.dataService.clusterManifest.ensureInitialized().subscribe( () => {
          // if < 5 seed nodes display warning for SFRP
          if (this.dataService.clusterManifest.isSfrpCluster){
              this.dataService.nodes.checkSeedNodeCount(5);
          }
      });
  });

    this.SFXClusterName = window.location.host; // TODO FIX THIS
  }

}

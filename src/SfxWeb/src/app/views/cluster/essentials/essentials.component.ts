import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ClusterUpgradeProgress, ClusterHealth, HealthStatisticsEntityKind } from '../../../Models/DataModels/Cluster';
import { HealthStateFilterFlags } from 'src/app/Models/HealthChunkRawDataTypes';
import { SystemApplication } from 'src/app/Models/DataModels/Application';
import { Observable, forkJoin, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { map, catchError } from 'rxjs/operators';
import { IDashboardViewModel, DashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { RoutesService } from 'src/app/services/routes.service';


@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {

  clusterUpgradeProgress: ClusterUpgradeProgress;
  nodes: NodeCollection;
  clusterHealth: ClusterHealth;
  systemApp: SystemApplication;
  unhealthyEvaluationsListSettings: ListSettings;

  nodesDashboard: IDashboardViewModel;
  appsDashboard: IDashboardViewModel;
  servicesDashboard: IDashboardViewModel;
  partitionsDashboard: IDashboardViewModel;
  replicasDashboard: IDashboardViewModel;
  upgradesDashboard: IDashboardViewModel;
  upgradeAppsCount = 0;

  constructor(public data: DataService,
              public injector: Injector,
              public settings: SettingsService,
              private routes: RoutesService) {
    super(injector);
  }

  setup() {
    this.clusterHealth = this.data.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    this.clusterUpgradeProgress = this.data.clusterUpgradeProgress;
    this.nodes = this.data.nodes;
    this.systemApp = this.data.systemApp;
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    return forkJoin([
      this.clusterHealth.refresh(messageHandler).pipe(map((clusterHealth: ClusterHealth) => {
        const nodesHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Node);
        this.nodesDashboard = DashboardViewModel.fromHealthStateCount('Nodes', 'Node', true, nodesHealthStateCount, this.data.routes, this.routes.getNodesViewPath());

        const appsHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Application);
        this.appsDashboard = DashboardViewModel.fromHealthStateCount('Applications', 'Application', true, appsHealthStateCount, this.data.routes, this.routes.getAppsViewPath());

        const servicesHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Service);
        this.servicesDashboard = DashboardViewModel.fromHealthStateCount('Services', 'Service', false, servicesHealthStateCount);

        const partitionsDashboard = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Partition);
        this.partitionsDashboard = DashboardViewModel.fromHealthStateCount('Partitions', 'Partition', false, partitionsDashboard);

        const replicasHealthStateCount = clusterHealth.getHealthStateCount(HealthStatisticsEntityKind.Replica);
        this.replicasDashboard = DashboardViewModel.fromHealthStateCount('Replicas', 'Replica', false, replicasHealthStateCount);
        clusterHealth.checkExpiredCertStatus();
    })),
      this.data.getApps(true, messageHandler)
                .pipe(map(apps => {
                    this.upgradeAppsCount = apps.collection.filter(app => app.isUpgrading).length;
                })),
      this.nodes.refresh(messageHandler),
      this.systemApp.refresh(messageHandler).pipe(catchError(err => of(null))),
      this.clusterUpgradeProgress.refresh(messageHandler)
    ]);
  }

}
